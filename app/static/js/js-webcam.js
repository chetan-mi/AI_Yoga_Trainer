// Global variables
let stream = null;
let loopHandle = null;
let currentPose = null;
let poseStartTime = null;
let lastAnnouncedPose = null;
let currentLanguage = 'en';
let timerInterval = null;
let asanaData = null;
let lastSpokenPose = null;
let isSpeaking = false;
let currentUserId = window.currentUserId || null;
let poseDetectionCount = 0;

// Session tracking variables
let sessionActive = false;
let sessionId = null;
let sessionStartTime = null;
let detectedPoses = new Map(); // Track poses and their durations
let loggedPosesInSession = []; // Track all logged poses with timestamps for debugging

const CAPTURE_MS = 1500; // Reduced to 1.5 seconds for faster detection
const POSE_CONFIRMATION_TIME = 1500; // Reduced to 1.5 seconds for faster voice feedback
const MIN_CONFIDENCE_FOR_LOGGING = 0.85; // Only log poses with 85%+ confidence

// Camera tracking loss handling
let trackingLossDetected = false;
let trackingLossStartTime = null;
let trackingLossTimeout = null;
const TRACKING_LOSS_GRACE_PERIOD = 3000; // 3 seconds grace period before resetting

// ============================================================================
// POSE STATE MANAGER - Handles pose transition detection and deduplication
// ============================================================================

/**
 * PoseStateManager - Manages pose detection state and tracks transitions
 * This class prevents duplicate database logging by tracking pose changes
 * and only logging when a user transitions from one pose to another.
 */
class PoseStateManager {
    constructor() {
        this.currentAsana = null;           // Currently detected pose
        this.previousAsana = null;          // Last LOGGED pose (to prevent duplicates)
        this.lastLoggedPose = null;         // Alias for previousAsana for clarity
        this.currentPoseStartTime = null;   // When current pose started (timestamp)
        this.confidenceReadings = [];       // Array of confidence values for averaging
        this.isStable = false;              // Whether pose has been stable for minimum duration
        
        // Confidence stabilization properties
        this.confidenceBuffer = [];         // Buffer of last 3 confidence readings
        this.confidenceBufferSize = 3;      // Size of confidence buffer
        this.stabilizationStartTime = null; // When stabilization period started
        this.stabilizationPeriod = 1000;    // 1 second stabilization period (in ms)
        this.pendingPose = null;            // Pose waiting for stabilization
        this.pendingConfidence = null;      // Confidence of pending pose
        
        console.log('🎯 PoseStateManager initialized with confidence stabilization');
    }
    
    /**
     * Initialize pose state at session start
     * Resets all tracking variables to their initial state
     */
    initializePoseState() {
        this.currentAsana = null;
        this.previousAsana = null;
        this.lastLoggedPose = null;
        this.currentPoseStartTime = null;
        this.confidenceReadings = [];
        this.isStable = false;
        
        // Reset stabilization properties
        this.confidenceBuffer = [];
        this.stabilizationStartTime = null;
        this.pendingPose = null;
        this.pendingConfidence = null;
        
        console.log('🔄 Pose state initialized - all tracking variables reset');
    }
    
    /**
     * Reset current pose tracking while preserving previous pose
     * Used when transitioning to a new pose
     */
    resetCurrentPose() {
        console.log(`🔄 Resetting current pose tracking (was: ${this.currentAsana})`);
        
        this.currentAsana = null;
        this.currentPoseStartTime = null;
        this.confidenceReadings = [];
        this.isStable = false;
        
        // Reset stabilization properties
        this.confidenceBuffer = [];
        this.stabilizationStartTime = null;
        this.pendingPose = null;
        this.pendingConfidence = null;
        
        console.log('✅ Current pose tracking cleared');
    }
    
    /**
     * Update pose state with new detection
     * @param {string} poseName - Name of detected pose
     * @param {number} confidence - Confidence score (0-1)
     */
    updateState(poseName, confidence) {
        const previousPose = this.currentAsana;
        
        // If this is a new pose, log the transition
        if (this.currentAsana !== poseName) {
            console.log(`🔀 Pose transition detected: ${this.currentAsana || 'none'} → ${poseName}`);
            this.previousAsana = this.currentAsana;
            this.currentAsana = poseName;
            this.currentPoseStartTime = Date.now();
            this.confidenceReadings = [confidence];
            this.isStable = false;
        } else {
            // Same pose, update confidence readings
            this.confidenceReadings.push(confidence);
            
            // Check if pose is now stable (held for minimum duration)
            const duration = this.getDuration();
            if (duration >= 2 && !this.isStable) {
                this.isStable = true;
                console.log(`✅ Pose stabilized: ${poseName} (${duration}s)`);
            }
        }
    }
    
    /**
     * Get current pose hold duration in seconds
     * @returns {number} Duration in seconds
     */
    getDuration() {
        if (!this.currentPoseStartTime) return 0;
        return Math.floor((Date.now() - this.currentPoseStartTime) / 1000);
    }
    
    /**
     * Get average confidence for current pose
     * @returns {number} Average confidence (0-1)
     */
    getAverageConfidence() {
        if (this.confidenceReadings.length === 0) return 0;
        const sum = this.confidenceReadings.reduce((a, b) => a + b, 0);
        return sum / this.confidenceReadings.length;
    }
    
    /**
     * Get current state summary for debugging
     * @returns {object} State summary
     */
    getStateSummary() {
        return {
            currentAsana: this.currentAsana,
            previousAsana: this.previousAsana,
            lastLoggedPose: this.lastLoggedPose,
            duration: this.getDuration(),
            averageConfidence: Math.round(this.getAverageConfidence() * 100),
            isStable: this.isStable,
            readingsCount: this.confidenceReadings.length,
            bufferSize: this.confidenceBuffer.length,
            pendingPose: this.pendingPose,
            isStabilizing: this.stabilizationStartTime !== null
        };
    }
    
    /**
     * Mark a pose as logged to prevent duplicate logging
     * @param {string} poseName - Name of the pose that was logged
     */
    markPoseAsLogged(poseName) {
        this.lastLoggedPose = poseName;
        this.previousAsana = poseName;
        console.log(`✅ Marked pose as logged: ${poseName}`);
    }
    
    /**
     * Add confidence reading to buffer (maintains last 3 readings)
     * @param {number} confidence - Confidence value (0-1)
     */
    addConfidenceToBuffer(confidence) {
        this.confidenceBuffer.push(confidence);
        
        // Keep only last 3 readings
        if (this.confidenceBuffer.length > this.confidenceBufferSize) {
            this.confidenceBuffer.shift();
        }
        
        console.log(`📊 Confidence buffer updated: [${this.confidenceBuffer.map(c => Math.round(c * 100) + '%').join(', ')}]`);
    }
    
    /**
     * Get average confidence from buffer
     * @returns {number} Average confidence (0-1)
     */
    getBufferAverageConfidence() {
        if (this.confidenceBuffer.length === 0) return 0;
        
        const sum = this.confidenceBuffer.reduce((a, b) => a + b, 0);
        const average = sum / this.confidenceBuffer.length;
        
        return average;
    }
    
    /**
     * Check if confidence readings are stable (all above threshold)
     * @param {number} threshold - Minimum confidence threshold (default: 0.85)
     * @returns {boolean} True if all buffer readings are above threshold
     */
    isConfidenceStable(threshold = MIN_CONFIDENCE_FOR_LOGGING) {
        if (this.confidenceBuffer.length < this.confidenceBufferSize) {
            console.log(`⏳ Confidence buffer not full yet (${this.confidenceBuffer.length}/${this.confidenceBufferSize})`);
            return false;
        }
        
        const allAboveThreshold = this.confidenceBuffer.every(c => c >= threshold);
        const avgConfidence = this.getBufferAverageConfidence();
        
        console.log(`🔍 Confidence stability check: ${allAboveThreshold ? 'STABLE' : 'UNSTABLE'} (avg: ${Math.round(avgConfidence * 100)}%)`);
        
        return allAboveThreshold;
    }
    
    /**
     * Start stabilization period for a new pose detection
     * @param {string} poseName - Name of detected pose
     * @param {number} confidence - Confidence score (0-1)
     */
    startStabilization(poseName, confidence) {
        this.stabilizationStartTime = Date.now();
        this.pendingPose = poseName;
        this.pendingConfidence = confidence;
        
        console.log(`⏱️ Stabilization started for ${poseName} (${Math.round(confidence * 100)}%)`);
        console.log(`   Will stabilize for ${this.stabilizationPeriod}ms`);
    }
    
    /**
     * Check if stabilization period has elapsed
     * @returns {boolean} True if stabilization period is complete
     */
    isStabilizationComplete() {
        if (this.stabilizationStartTime === null) {
            return false;
        }
        
        const elapsed = Date.now() - this.stabilizationStartTime;
        const isComplete = elapsed >= this.stabilizationPeriod;
        
        if (isComplete) {
            console.log(`✅ Stabilization period complete (${elapsed}ms elapsed)`);
        } else {
            console.log(`⏳ Stabilization in progress (${elapsed}ms / ${this.stabilizationPeriod}ms)`);
        }
        
        return isComplete;
    }
    
    /**
     * Reset stabilization state
     */
    resetStabilization() {
        console.log(`🔄 Resetting stabilization (was pending: ${this.pendingPose})`);
        
        this.stabilizationStartTime = null;
        this.pendingPose = null;
        this.pendingConfidence = null;
    }
    
    /**
     * Check if a pose change should be accepted based on stabilization
     * This prevents rapid state changes from confidence noise
     * @param {string} newPose - Newly detected pose
     * @param {number} confidence - Confidence score (0-1)
     * @returns {object} Stabilization result with action and reason
     */
    checkStabilization(newPose, confidence) {
        // Add confidence to buffer
        this.addConfidenceToBuffer(confidence);
        
        // If no current pose, no stabilization needed
        if (this.currentAsana === null) {
            console.log(`🎯 No current pose - accepting ${newPose} immediately`);
            return {
                shouldAccept: true,
                action: 'ACCEPT_FIRST_POSE',
                reason: 'no_current_pose'
            };
        }
        
        // If same pose as current, no stabilization needed
        if (newPose === this.currentAsana) {
            console.log(`✓ Same pose detected - continuing ${newPose}`);
            return {
                shouldAccept: true,
                action: 'CONTINUE_CURRENT',
                reason: 'same_pose'
            };
        }
        
        // Different pose detected - check if we need stabilization
        console.log(`🔀 Different pose detected: ${this.currentAsana} → ${newPose}`);
        
        // If not currently stabilizing, start stabilization period
        if (this.stabilizationStartTime === null) {
            this.startStabilization(newPose, confidence);
            
            return {
                shouldAccept: false,
                action: 'START_STABILIZATION',
                reason: 'new_pose_detected',
                pendingPose: newPose
            };
        }
        
        // If stabilizing for a different pose, reset and start new stabilization
        if (this.pendingPose !== newPose) {
            console.log(`⚠️ Pose changed during stabilization: ${this.pendingPose} → ${newPose}`);
            this.resetStabilization();
            this.startStabilization(newPose, confidence);
            
            return {
                shouldAccept: false,
                action: 'RESTART_STABILIZATION',
                reason: 'pose_changed_during_stabilization',
                pendingPose: newPose
            };
        }
        
        // Same pending pose - check if stabilization period is complete
        if (!this.isStabilizationComplete()) {
            return {
                shouldAccept: false,
                action: 'WAIT_STABILIZATION',
                reason: 'stabilization_in_progress',
                pendingPose: newPose
            };
        }
        
        // Stabilization period complete - check if confidence is stable
        if (!this.isConfidenceStable()) {
            console.log(`⚠️ Confidence not stable - resetting stabilization`);
            this.resetStabilization();
            
            return {
                shouldAccept: false,
                action: 'REJECT_UNSTABLE',
                reason: 'confidence_fluctuating',
                pendingPose: newPose
            };
        }
        
        // All checks passed - accept the pose change
        console.log(`✅ Stabilization complete - accepting pose change to ${newPose}`);
        this.resetStabilization();
        
        return {
            shouldAccept: true,
            action: 'ACCEPT_AFTER_STABILIZATION',
            reason: 'stabilization_successful',
            pose: newPose
        };
    }
}

// Initialize global pose state manager
const poseStateManager = new PoseStateManager();

// ============================================================================
// END POSE STATE MANAGER
// ============================================================================

// ============================================================================
// POSE DURATION TRACKER - Tracks pose hold duration and confidence
// ============================================================================

/**
 * PoseDurationTracker - Tracks duration and confidence for a single pose hold
 * This class manages timing and confidence accumulation for pose validation
 */
class PoseDurationTracker {
    constructor() {
        this.startTime = null;              // Timestamp when pose tracking started
        this.confidenceSum = 0;             // Sum of all confidence readings
        this.confidenceCount = 0;           // Number of confidence readings
        
        console.log('⏱️ PoseDurationTracker initialized');
    }
    
    /**
     * Start tracking a new pose
     * @param {number} timestamp - Starting timestamp (optional, defaults to now)
     */
    start(timestamp = null) {
        this.startTime = timestamp || Date.now();
        this.confidenceSum = 0;
        this.confidenceCount = 0;
        
        console.log(`⏱️ Duration tracking started at ${new Date(this.startTime).toISOString()}`);
    }
    
    /**
     * Update confidence readings for the current pose
     * @param {number} confidence - Confidence value (0-1)
     */
    update(confidence) {
        if (this.startTime === null) {
            console.warn('⚠️ Cannot update confidence - tracking not started');
            return;
        }
        
        this.confidenceSum += confidence;
        this.confidenceCount++;
        
        console.log(`📊 Confidence updated: ${Math.round(confidence * 100)}% (total readings: ${this.confidenceCount})`);
    }
    
    /**
     * Get the duration of the current pose hold in seconds
     * @returns {number} Duration in seconds
     */
    getDuration() {
        if (this.startTime === null) {
            return 0;
        }
        
        const durationMs = Date.now() - this.startTime;
        const durationSeconds = Math.floor(durationMs / 1000);
        
        return durationSeconds;
    }
    
    /**
     * Get the average confidence for the current pose hold
     * @returns {number} Average confidence (0-1)
     */
    getAverageConfidence() {
        if (this.confidenceCount === 0) {
            return 0;
        }
        
        const average = this.confidenceSum / this.confidenceCount;
        return average;
    }
    
    /**
     * Check if the pose meets the minimum duration requirement (2 seconds)
     * @returns {boolean} True if duration >= 2 seconds
     */
    meetsMinimumDuration() {
        const duration = this.getDuration();
        const meetsMinimum = duration >= 2;
        
        console.log(`✓ Duration check: ${duration}s ${meetsMinimum ? '(meets minimum)' : '(below minimum)'}`);
        
        return meetsMinimum;
    }
    
    /**
     * Reset all tracking data
     */
    reset() {
        console.log(`🔄 Resetting duration tracker (was tracking for ${this.getDuration()}s)`);
        
        this.startTime = null;
        this.confidenceSum = 0;
        this.confidenceCount = 0;
        
        console.log('✅ Duration tracker reset complete');
    }
    
    /**
     * Get a summary of the current tracking state (for debugging)
     * @returns {object} Summary object
     */
    getSummary() {
        return {
            isTracking: this.startTime !== null,
            duration: this.getDuration(),
            averageConfidence: Math.round(this.getAverageConfidence() * 100),
            confidenceReadings: this.confidenceCount,
            meetsMinimum: this.meetsMinimumDuration()
        };
    }
}

// ============================================================================
// END POSE DURATION TRACKER
// ============================================================================

// ============================================================================
// POSE TRANSITION DETECTION - Detects when user transitions between poses
// ============================================================================

/**
 * Detect pose transitions and determine appropriate action
 * This function is the core of the deduplication logic - it determines whether
 * a detected pose should start new tracking, trigger a transition, continue
 * existing tracking, or be ignored.
 * 
 * @param {string} newPose - The newly detected pose name
 * @param {number} confidence - Confidence score for the detection (0-1)
 * @returns {object} Transition object with action type and relevant data
 * 
 * Possible actions:
 * - START_NEW_POSE: First pose of session, begin tracking
 * - TRANSITION: User changed poses, log previous and start new
 * - CONTINUE: Same pose detected, update duration only
 * - IGNORE: Low confidence, don't update state
 * - STABILIZING: Pose change detected, waiting for stabilization
 */
function detectPoseTransition(newPose, confidence) {
    console.log(`\n========================================`);
    console.log(`🔍 DETECTION: pose="${newPose}", confidence=${Math.round(confidence * 100)}%`);
    console.log(`📊 STATE: current="${poseStateManager.currentAsana}", lastLogged="${poseStateManager.lastLoggedPose}"`);
    
    // Step 1: Validate confidence (>= 85%)
    if (confidence < MIN_CONFIDENCE_FOR_LOGGING) {
        console.log(`❌ IGNORE - Low confidence: ${Math.round(confidence * 100)}% < 85%`);
        console.log(`========================================\n`);
        
        return {
            transition: false,
            action: 'IGNORE',
            reason: 'low_confidence',
            confidence: confidence,
            pose: newPose
        };
    }
    
    // Step 2: Check if this is the first pose (currentAsana === null)
    if (poseStateManager.currentAsana === null) {
        console.log(`🎯 START_NEW_POSE - First pose of session`);
        console.log(`========================================\n`);
        return {
            transition: true,
            action: 'START_NEW_POSE',
            pose: newPose,
            confidence: confidence
        };
    }
    
    // Step 3: Check if pose changed (newPose !== currentAsana)
    // SIMPLIFIED: Only check pose NAME, not confidence fluctuations
    if (newPose !== poseStateManager.currentAsana) {
        const duration = poseStateManager.getDuration();
        const avgConfidence = poseStateManager.getAverageConfidence();
        
        console.log(`🔀 TRANSITION DETECTED`);
        console.log(`   From: ${poseStateManager.currentAsana}`);
        console.log(`   To: ${newPose}`);
        console.log(`   Duration: ${duration}s`);
        console.log(`   Avg Confidence: ${Math.round(avgConfidence * 100)}%`);
        console.log(`========================================\n`);
        
        return {
            transition: true,
            action: 'TRANSITION',
            fromPose: poseStateManager.currentAsana,
            toPose: newPose,
            previousDuration: duration,
            previousConfidence: avgConfidence,
            newConfidence: confidence
        };
    }
    
    // Step 4: Same pose - continue tracking
    const duration = poseStateManager.getDuration();
    console.log(`✓ CONTINUE - Same pose, duration: ${duration}s`);
    console.log(`========================================\n`);
    
    return {
        transition: false,
        action: 'CONTINUE',
        pose: newPose,
        confidence: confidence,
        duration: duration
    };
}

// ============================================================================
// END POSE TRANSITION DETECTION
// ============================================================================

// ============================================================================
// POSE TRANSITION HANDLER - Handles different transition actions
// ============================================================================

/**
 * Handle pose transitions based on detection results
 * This function processes the transition data from detectPoseTransition()
 * and takes appropriate actions (start new pose, log transition, continue, or ignore)
 * 
 * @param {object} transitionData - Transition object from detectPoseTransition()
 * @returns {Promise<void>}
 * 
 * Actions handled:
 * - START_NEW_POSE: First pose of session, initialize tracking
 * - TRANSITION: User changed poses, log previous pose and start tracking new one
 * - CONTINUE: Same pose detected, update duration tracking only
 * - IGNORE: Low confidence detection, no state changes
 * - STABILIZING: Pose change detected, waiting for confidence stabilization
 */
async function handlePoseTransition(transitionData) {
    console.log(`\n🎬 HANDLING ACTION: ${transitionData.action}`);
    
    switch (transitionData.action) {
        case 'START_NEW_POSE':
            // First pose of the session - initialize tracking
            console.log(`\n🎯 ========== STARTING NEW POSE ==========`);
            console.log(`Pose: ${transitionData.pose}`);
            console.log(`Confidence: ${Math.round(transitionData.confidence * 100)}%`);
            console.log('==========================================\n');
            
            // Update pose state manager
            poseStateManager.currentAsana = transitionData.pose;
            poseStateManager.currentPoseStartTime = Date.now();
            poseStateManager.confidenceReadings = [transitionData.confidence];
            poseStateManager.isStable = false;
            
            console.log(`✅ Pose tracking started for: ${transitionData.pose}`);
            console.log(`   currentAsana is now: ${poseStateManager.currentAsana}`);
            console.log(`   Start time: ${new Date(poseStateManager.currentPoseStartTime).toISOString()}`);
            break;
            
        case 'TRANSITION':
            // User changed poses - log the previous pose and start tracking new one
            console.log(`🔀 Transitioning: ${transitionData.fromPose} → ${transitionData.toPose}`);
            
            // Check if previous pose was held long enough to log
            const meetsMinimum = transitionData.previousDuration >= 2;
            
            // Check if previous pose is different from the last logged pose (prevent duplicates)
            const isDifferentFromLastLogged = transitionData.fromPose !== poseStateManager.lastLoggedPose;
            
            // SIMPLIFIED: Check if ANY confidence reading was >= 85% (not average)
            // This handles confidence fluctuations between 85-100%
            const hasHighConfidenceReading = poseStateManager.confidenceReadings.some(c => c >= MIN_CONFIDENCE_FOR_LOGGING);
            
            console.log(`   Last logged pose: ${poseStateManager.lastLoggedPose || 'none'}`);
            console.log(`   Previous pose: ${transitionData.fromPose}`);
            console.log(`   Average Confidence: ${Math.round(transitionData.previousConfidence * 100)}%`);
            console.log(`   Has high confidence reading (>= 85%): ${hasHighConfidenceReading}`);
            console.log(`   Meets minimum duration (>= 2s): ${meetsMinimum}`);
            console.log(`   Is different from last logged: ${isDifferentFromLastLogged}`);
            
            // Prepare pose data for logging
            const poseData = {
                name: transitionData.fromPose,
                duration: transitionData.previousDuration,
                averageConfidence: transitionData.previousConfidence,
                meetsMinimumDuration: meetsMinimum
            };
            
            // CRITICAL CHECK: Skip if NO high confidence readings
            if (!hasHighConfidenceReading) {
                console.log(`⚠️ LOW CONFIDENCE - Skipping ${transitionData.fromPose}`);
                console.log(`   No readings >= 85% detected`);
                console.log(`   Duration: ${transitionData.previousDuration}s`);
                console.log(`   Reason: All confidence readings below threshold`);
                console.log(`   Action: Not logging to database, starting new pose`);
                
                // Start tracking the new pose without logging
                poseStateManager.currentAsana = transitionData.toPose;
                poseStateManager.currentPoseStartTime = Date.now();
                poseStateManager.confidenceReadings = [transitionData.newConfidence];
                poseStateManager.isStable = false;
                
                console.log(`✅ Now tracking new pose: ${transitionData.toPose} (low confidence pose skipped)`);
            } else if (!meetsMinimum) {
                // Handle rapid transitions (poses held < 2 seconds)
                console.log(`⚡ RAPID TRANSITION DETECTED - Skipping ${transitionData.fromPose}`);
                console.log(`   Duration: ${transitionData.previousDuration}s (minimum required: 2s)`);
                console.log(`   Average Confidence: ${Math.round(transitionData.previousConfidence * 100)}%`);
                console.log(`   Reason: Pose held for less than minimum duration`);
                console.log(`   Action: Not logging to database, immediately starting new pose`);
                
                // Immediately start tracking the new pose (don't wait)
                // Note: We DON'T update lastLoggedPose here because we didn't log it
                poseStateManager.currentAsana = transitionData.toPose;
                poseStateManager.currentPoseStartTime = Date.now();
                poseStateManager.confidenceReadings = [transitionData.newConfidence];
                poseStateManager.isStable = false;
                
                // Reset confidence buffer for new pose
                poseStateManager.confidenceBuffer = [transitionData.newConfidence];
                
                console.log(`✅ Now tracking new pose: ${transitionData.toPose} (rapid transition handled)`);
            } else if (!isDifferentFromLastLogged) {
                // Same pose as last logged - skip to prevent duplicate
                console.log(`⚠️ DUPLICATE DETECTED - Skipping ${transitionData.fromPose}`);
                console.log(`   This pose was already logged in the previous transition`);
                console.log(`   Duration: ${transitionData.previousDuration}s`);
                console.log(`   Average Confidence: ${Math.round(transitionData.previousConfidence * 100)}%`);
                console.log(`   Action: Not logging to database, starting new pose`);
                
                // Start tracking the new pose without logging
                poseStateManager.currentAsana = transitionData.toPose;
                poseStateManager.currentPoseStartTime = Date.now();
                poseStateManager.confidenceReadings = [transitionData.newConfidence];
                poseStateManager.isStable = false;
                
                // Reset confidence buffer for new pose
                poseStateManager.confidenceBuffer = [transitionData.newConfidence];
                
                console.log(`✅ Now tracking new pose: ${transitionData.toPose} (duplicate prevented)`);
            } else {
                // Pose meets ALL requirements - log it to database
                console.log(`✓ Previous pose meets ALL requirements - logging to database`);
                console.log(`   ✓ Confidence: ${Math.round(transitionData.previousConfidence * 100)}% (>= 85%)`);
                console.log(`   ✓ Duration: ${transitionData.previousDuration}s (>= 2s)`);
                console.log(`   ✓ Different from last logged: YES`);
                
                // Log the previous pose to database
                const logResult = await logPoseDetection(poseData);
                
                // Only mark as logged if the database logging was successful
                if (logResult) {
                    poseStateManager.markPoseAsLogged(transitionData.fromPose);
                }
                
                // Start tracking the new pose
                poseStateManager.currentAsana = transitionData.toPose;
                poseStateManager.currentPoseStartTime = Date.now();
                poseStateManager.confidenceReadings = [transitionData.newConfidence];
                poseStateManager.isStable = false;
                
                // Reset confidence buffer for new pose
                poseStateManager.confidenceBuffer = [transitionData.newConfidence];
                
                console.log(`✅ Now tracking new pose: ${transitionData.toPose}`);
            }
            break;
            
        case 'CONTINUE':
            // Same pose detected - update duration tracking only
            const duration = transitionData.duration;
            console.log(`⏱️ Continuing pose: ${transitionData.pose} (${duration}s)`);
            
            // Update confidence readings
            poseStateManager.confidenceReadings.push(transitionData.confidence);
            
            // Check if pose has become stable (>= 2 seconds)
            if (duration >= 2 && !poseStateManager.isStable) {
                poseStateManager.isStable = true;
                console.log(`✅ Pose stabilized: ${transitionData.pose} (${duration}s)`);
            }
            
            // Log current state for debugging
            console.log(`   Average confidence: ${Math.round(poseStateManager.getAverageConfidence() * 100)}%`);
            console.log(`   Confidence readings: ${poseStateManager.confidenceReadings.length}`);
            break;
            

            
        case 'IGNORE':
            // Low confidence detection - don't update state
            console.log(`⚠️ Ignoring detection: ${transitionData.pose} (${Math.round(transitionData.confidence * 100)}% confidence)`);
            console.log(`   Reason: ${transitionData.reason}`);
            
            // Maintain current pose state if it exists and is stable
            if (poseStateManager.isStable) {
                console.log(`   Maintaining current stable pose: ${poseStateManager.currentAsana}`);
            }
            break;
            
        default:
            console.warn(`⚠️ Unknown transition action: ${transitionData.action}`);
            break;
    }
    
    // Log current state summary for debugging
    const stateSummary = poseStateManager.getStateSummary();
    console.log(`📊 Current state:`, stateSummary);
}

// ============================================================================
// END POSE TRANSITION HANDLER
// ============================================================================

// ============================================================================
// CAMERA TRACKING LOSS HANDLER - Handles camera tracking failures
// ============================================================================

/**
 * Handle camera tracking loss
 * When pose detection fails (no landmarks, error, etc.), maintain current pose
 * state for 3 seconds before resetting. Log current pose if stable.
 */
function handleTrackingLoss() {
    console.log('⚠️ Camera tracking loss detected');
    
    // If already handling tracking loss, don't restart the timer
    if (trackingLossDetected) {
        console.log('   Already handling tracking loss, maintaining grace period');
        return;
    }
    
    // Mark tracking loss as detected
    trackingLossDetected = true;
    trackingLossStartTime = Date.now();
    
    // Show visual indicator
    showTrackingLossIndicator();
    
    // Log current state
    if (poseStateManager.currentAsana) {
        const duration = poseStateManager.getDuration();
        const avgConfidence = poseStateManager.getAverageConfidence();
        console.log(`   Current pose: ${poseStateManager.currentAsana}`);
        console.log(`   Duration: ${duration}s`);
        console.log(`   Average confidence: ${Math.round(avgConfidence * 100)}%`);
        console.log(`   Is stable: ${poseStateManager.isStable}`);
    } else {
        console.log('   No current pose being tracked');
    }
    
    // Set timeout to log and reset after grace period
    trackingLossTimeout = setTimeout(async () => {
        console.log('⏰ Tracking loss grace period expired (3 seconds)');
        
        // Log current pose if it was stable
        if (poseStateManager.currentAsana && poseStateManager.isStable) {
            const duration = poseStateManager.getDuration();
            const avgConfidence = poseStateManager.getAverageConfidence();
            
            console.log(`📝 Checking current pose before reset: ${poseStateManager.currentAsana}`);
            console.log(`   Duration: ${duration}s, Average Confidence: ${Math.round(avgConfidence * 100)}%`);
            console.log(`   Last logged pose: ${poseStateManager.lastLoggedPose || 'none'}`);
            
            // CRITICAL: Check if average confidence meets threshold (>= 85%)
            if (avgConfidence < MIN_CONFIDENCE_FOR_LOGGING) {
                console.log(`⚠️ Current pose has low confidence - skipping`);
                console.log(`   Average Confidence: ${Math.round(avgConfidence * 100)}% (minimum: 85%)`);
            } else {
                // Check if this pose is different from the last logged pose (prevent duplicates)
                const isDifferentFromLastLogged = poseStateManager.currentAsana !== poseStateManager.lastLoggedPose;
                
                if (!isDifferentFromLastLogged) {
                    console.log(`⚠️ Current pose is same as last logged pose - skipping to prevent duplicate`);
                } else if (duration >= 2) {
                    // Check if pose meets minimum duration
                    const poseData = {
                        name: poseStateManager.currentAsana,
                        duration: duration,
                        averageConfidence: avgConfidence,
                        meetsMinimumDuration: true
                    };
                    
                    console.log(`✓ Pose meets ALL requirements - logging`);
                    console.log(`   ✓ Confidence: ${Math.round(avgConfidence * 100)}% (>= 85%)`);
                    console.log(`   ✓ Duration: ${duration}s (>= 2s)`);
                    console.log(`   ✓ Different from last logged: YES`);
                    
                    const logResult = await logPoseDetection(poseData);
                    
                    // Mark as logged if successful
                    if (logResult) {
                        poseStateManager.markPoseAsLogged(poseStateManager.currentAsana);
                    }
                    
                    console.log(`✅ Pose logged due to tracking loss: ${poseStateManager.currentAsana} (${duration}s)`);
                } else {
                    console.log(`⏭️ Pose not logged - below minimum duration: ${duration}s`);
                }
            }
        }
        
        // Reset pose state
        console.log('🔄 Resetting pose state due to tracking loss');
        poseStateManager.resetCurrentPose();
        
        // Hide tracking loss indicator
        hideTrackingLossIndicator();
        
        // Reset tracking loss flags
        trackingLossDetected = false;
        trackingLossStartTime = null;
        trackingLossTimeout = null;
        
        console.log('✅ Tracking loss handling complete - ready for new detections');
    }, TRACKING_LOSS_GRACE_PERIOD);
    
    console.log(`⏳ Grace period started - will reset in ${TRACKING_LOSS_GRACE_PERIOD / 1000} seconds`);
}

/**
 * Handle successful tracking recovery
 * Called when pose detection succeeds after a tracking loss
 */
function handleTrackingRecovery() {
    if (!trackingLossDetected) {
        return; // Not in tracking loss state
    }
    
    console.log('✅ Camera tracking recovered');
    
    // Cancel the timeout
    if (trackingLossTimeout) {
        clearTimeout(trackingLossTimeout);
        trackingLossTimeout = null;
        console.log('   Cancelled tracking loss timeout');
    }
    
    // Hide tracking loss indicator
    hideTrackingLossIndicator();
    
    // Reset tracking loss flags
    trackingLossDetected = false;
    trackingLossStartTime = null;
    
    // Log recovery time
    const recoveryTime = Date.now() - trackingLossStartTime;
    console.log(`   Recovered after ${Math.round(recoveryTime / 1000)}s`);
    
    // Maintain current pose state (don't reset)
    if (poseStateManager.currentAsana) {
        console.log(`   Maintaining current pose: ${poseStateManager.currentAsana}`);
    }
}

/**
 * Show visual indicator for tracking loss
 */
function showTrackingLossIndicator() {
    let indicator = document.getElementById('tracking-loss-indicator');
    
    if (!indicator) {
        // Create indicator if it doesn't exist
        indicator = document.createElement('div');
        indicator.id = 'tracking-loss-indicator';
        indicator.style.cssText = `
            display: none;
            position: fixed;
            top: 80px;
            right: 20px;
            background: #ff6b6b;
            color: white;
            padding: 12px 18px;
            border-radius: 8px;
            z-index: 1000;
            box-shadow: 0 4px 15px rgba(255, 107, 107, 0.4);
            font-weight: 500;
            animation: pulse 1.5s ease-in-out infinite;
        `;
        indicator.innerHTML = '⚠️ Camera Tracking Lost';
        document.body.appendChild(indicator);
        
        // Add pulse animation
        const style = document.createElement('style');
        style.textContent = `
            @keyframes pulse {
                0%, 100% { opacity: 1; transform: scale(1); }
                50% { opacity: 0.8; transform: scale(1.02); }
            }
        `;
        document.head.appendChild(style);
    }
    
    indicator.style.display = 'block';
    console.log('👁️ Tracking loss indicator shown');
}

/**
 * Hide visual indicator for tracking loss
 */
function hideTrackingLossIndicator() {
    const indicator = document.getElementById('tracking-loss-indicator');
    
    if (indicator) {
        indicator.style.display = 'none';
        console.log('👁️ Tracking loss indicator hidden');
    }
}

// ============================================================================
// END CAMERA TRACKING LOSS HANDLER
// ============================================================================

// Full pose names with Sanskrit names, benefits, and contraindications
const poseNames = {
    'Tree_Pose_or_Vrksasana_': {
        english: 'Tree Pose',
        sanskrit: 'Vrksasana (वृक्षासन)',
        full: 'Tree Pose (Vrksasana)',
        benefits: 'Strengthens legs, improves balance, stretches hips and thighs, enhances focus and concentration',
        contraindications: 'Avoid if you have low blood pressure, ankle or knee injuries, or severe balance issues',
        timing: 'Best done on empty stomach, early morning or evening. Hold for 30-60 seconds per side.'
    },
    'Downward-Facing_Dog_pose_or_Adho_Mukha_Svanasana_': {
        english: 'Downward-Facing Dog',
        sanskrit: 'Adho Mukha Svanasana (अधो मुख श्वानासन)',
        full: 'Downward-Facing Dog (Adho Mukha Svanasana)',
        benefits: 'Strengthens arms and legs, stretches spine, improves circulation, energizes the body',
        contraindications: 'Avoid if you have carpal tunnel syndrome, high blood pressure, or wrist injuries',
        timing: 'Best on empty stomach. Hold for 1-3 minutes. Can be done anytime of day.'
    },
    'Warrior_I_Pose_or_Virabhadrasana_I_': {
        english: 'Warrior I',
        sanskrit: 'Virabhadrasana I (वीरभद्रासन प्रथम)',
        full: 'Warrior I (Virabhadrasana I)',
        benefits: 'Strengthens legs, opens hips and chest, improves balance, builds stamina',
        contraindications: 'Avoid if you have knee or ankle injuries, high blood pressure, or heart problems',
        timing: 'Best on empty stomach. Hold for 30-60 seconds per side. Morning or evening.'
    },
    'Warrior_II_Pose_or_Virabhadrasana_II_': {
        english: 'Warrior II',
        sanskrit: 'Virabhadrasana II (वीरभद्रासन द्वितीय)',
        full: 'Warrior II (Virabhadrasana II)',
        benefits: 'Strengthens legs and arms, improves stamina, stretches groin and chest',
        contraindications: 'Avoid if you have knee or ankle injuries, or severe arthritis',
        timing: 'Best on empty stomach. Hold for 30-60 seconds per side. Any time of day.'
    },
    'Child_Pose_or_Balasana_': {
        english: 'Child Pose',
        sanskrit: 'Balasana (बालासन)',
        full: 'Child Pose (Balasana)',
        benefits: 'Calms the mind, relieves stress, stretches hips and thighs, gentle back stretch',
        contraindications: 'Avoid if you have knee injuries or are pregnant (modify with props)',
        timing: 'Can be done anytime, even after meals. Hold for 1-3 minutes or longer.'
    },
    'Cobra_Pose_or_Bhujangasana_': {
        english: 'Cobra Pose',
        sanskrit: 'Bhujangasana (भुजंगासन)',
        full: 'Cobra Pose (Bhujangasana)',
        benefits: 'Strengthens spine, opens chest, improves posture, stimulates abdominal organs',
        contraindications: 'Avoid if you have back injuries, carpal tunnel syndrome, or are pregnant',
        timing: 'Best on empty stomach. Hold for 15-30 seconds. Morning or evening.'
    },
    'Plank_Pose_or_Kumbhakasana_': {
        english: 'Plank Pose',
        sanskrit: 'Kumbhakasana (कुम्भकासन)',
        full: 'Plank Pose (Kumbhakasana)',
        benefits: 'Strengthens core, arms, and shoulders, improves posture, builds endurance',
        contraindications: 'Avoid if you have carpal tunnel syndrome, shoulder injuries, or high blood pressure',
        timing: 'Best on empty stomach. Hold for 30-60 seconds. Any time of day.'
    },
    'Bridge_Pose_or_Setu_Bandha_Sarvangasana_': {
        english: 'Bridge Pose',
        sanskrit: 'Setu Bandha Sarvangasana (सेतु बन्ध सर्वांगासन)',
        full: 'Bridge Pose (Setu Bandha Sarvangasana)',
        benefits: 'Strengthens back and legs, opens chest, improves spinal flexibility, calms the mind',
        contraindications: 'Avoid if you have neck injuries, high blood pressure, or severe back problems',
        timing: 'Best on empty stomach. Hold for 30-60 seconds. Morning or evening.'
    },
    'Corpse_Pose_or_Savasana_': {
        english: 'Corpse Pose',
        sanskrit: 'Savasana (शवासन)',
        full: 'Corpse Pose (Savasana)',
        benefits: 'Deep relaxation, reduces stress, lowers blood pressure, improves sleep quality',
        contraindications: 'No contraindications - suitable for everyone',
        timing: 'Can be done anytime. Hold for 5-15 minutes. Best at the end of practice.'
    },
    'Chair_Pose_or_Utkatasana_': {
        english: 'Chair Pose',
        sanskrit: 'Utkatasana (उत्कटासन)',
        full: 'Chair Pose (Utkatasana)',
        benefits: 'Strengthens legs and core, improves balance, tones glutes and thighs',
        contraindications: 'Avoid if you have knee injuries, low blood pressure, or severe arthritis',
        timing: 'Best on empty stomach. Hold for 30-60 seconds. Morning or evening.'
    },
    'Mountain_Pose_or_Tadasana_': {
        english: 'Mountain Pose',
        sanskrit: 'Tadasana (ताडासन)',
        full: 'Mountain Pose (Tadasana)'
    },
    'Forward_Fold_or_Uttanasana_': {
        english: 'Forward Fold',
        sanskrit: 'Uttanasana (उत्तानासन)',
        full: 'Forward Fold (Uttanasana)'
    },
    'Triangle_Pose_or_Trikonasana_': {
        english: 'Triangle Pose',
        sanskrit: 'Trikonasana (त्रिकोणासन)',
        full: 'Triangle Pose (Trikonasana)'
    },
    'Half_Moon_Pose_or_Ardha_Chandrasana_': {
        english: 'Half Moon Pose',
        sanskrit: 'Ardha Chandrasana (अर्ध चन्द्रासन)',
        full: 'Half Moon Pose (Ardha Chandrasana)'
    },
    'Eagle_Pose_or_Garudasana_': {
        english: 'Eagle Pose',
        sanskrit: 'Garudasana (गरुडासन)',
        full: 'Eagle Pose (Garudasana)'
    },
    'Camel_Pose_or_Ustrasana_': {
        english: 'Camel Pose',
        sanskrit: 'Ustrasana (उष्ट्रासन)',
        full: 'Camel Pose (Ustrasana)'
    },
    'Fish_Pose_or_Matsyasana_': {
        english: 'Fish Pose',
        sanskrit: 'Matsyasana (मत्स्यासन)',
        full: 'Fish Pose (Matsyasana)'
    },
    'Lotus_Pose_or_Padmasana_': {
        english: 'Lotus Pose',
        sanskrit: 'Padmasana (पद्मासन)',
        full: 'Lotus Pose (Padmasana)'
    },
    'Seated_Forward_Bend_or_Paschimottanasana_': {
        english: 'Seated Forward Bend',
        sanskrit: 'Paschimottanasana (पश्चिमोत्तानासन)',
        full: 'Seated Forward Bend (Paschimottanasana)'
    },
    'Revolved_Triangle_or_Parivrtta_Trikonasana_': {
        english: 'Revolved Triangle',
        sanskrit: 'Parivrtta Trikonasana (परिवृत्त त्रिकोणासन)',
        full: 'Revolved Triangle (Parivrtta Trikonasana)'
    }
};

// DOM elements
const video = document.getElementById('video');
const canvas = document.getElementById('canvas');
const startBtn = document.getElementById('startBtn');
const stopBtn = document.getElementById('stopBtn');
const poseNameEl = document.getElementById('poseName');
const confidenceValueBottom = document.getElementById('confidenceValueBottom');
const detectionAccuracy = document.getElementById('detectionAccuracy');
const instructionsList = document.getElementById('instructionsList');
const instructionsPanel = document.getElementById('instructionsPanel');
const togglePanelBtn = document.getElementById('togglePanelBtn');
const poseNameFull = document.getElementById('poseNameFull');
const sanskritName = document.getElementById('sanskritName');
const confidenceValueAnalysis = document.getElementById('confidenceValueAnalysis');
const confidenceBarAnalysis = document.getElementById('confidenceBarAnalysis');

// Body measurement elements
const spineAngle = document.getElementById('spineAngle');
const kneeAngle = document.getElementById('kneeAngle');
const hipAngle = document.getElementById('hipAngle');
const shoulderAngle = document.getElementById('shoulderAngle');
const armSpan = document.getElementById('armSpan');
const legLength = document.getElementById('legLength');
const torsoLength = document.getElementById('torsoLength');
const balanceScore = document.getElementById('balanceScore');
const benefitsText = document.getElementById('benefitsText');
const contraindicationsText = document.getElementById('contraindicationsText');
const benefitsContent = document.getElementById('benefitsContent');
const contraindicationsContent = document.getElementById('contraindicationsContent');
const benefitsBtn = document.getElementById('benefitsBtn');
const panelTitle = document.getElementById('panelTitle');
const languageSelect = document.getElementById('languageSelect');

// Load asana data from JSON file
async function loadAsanaData() {
    try {
        const response = await fetch('/static/asana_data.json');
        if (!response.ok) {
            throw new Error('Failed to load asana data');
        }
        asanaData = await response.json();
        console.log('Asana data loaded successfully');
        console.log('Available poses:', Object.keys(asanaData));
        
        // Test with a known pose
        const testPose = 'Tree_Pose_or_Vrksasana_';
        if (asanaData[testPose]) {
            console.log('Test pose data:', asanaData[testPose]);
        }
    } catch (error) {
        console.error('Error loading asana data:', error);
        asanaData = null;
    }
}

// Debug function to test pose matching
window.testPoseMatching = function(poseName) {
    console.log('Testing pose matching for:', poseName);
    const result = getPoseDataFromJSON(poseName);
    console.log('Result:', result);
    return result;
};

// Debug function to test warnings display
window.testWarningsDisplay = function(poseName) {
    console.log('Testing warnings display for:', poseName);
    const jsonData = getPoseDataFromJSON(poseName);
    console.log('JSON data:', jsonData);
    if (jsonData && jsonData.warnings) {
        console.log('Warnings found:', jsonData.warnings);
        const formatted = formatAsBulletPoints(jsonData.warnings);
        console.log('Formatted warnings:', formatted);
        return formatted;
    } else {
        console.log('No warnings found in JSON data');
        return null;
    }
};

// Debug function to show all available poses
window.showAllPoses = function() {
    if (asanaData) {
        console.log('All available poses:', Object.keys(asanaData));
        return Object.keys(asanaData);
    } else {
        console.log('Asana data not loaded');
        return null;
    }
};


// Initialization moved to end of file


async function startCamera() {
    try {
        stream = await navigator.mediaDevices.getUserMedia({ 
            video: { 
                width: { ideal: 640 },
                height: { ideal: 480 },
                facingMode: 'user'
            } 
        });
        video.srcObject = stream;
        video.style.display = 'block'; // Make video visible
        await video.play();
        
        // Video setup complete
        
        return true;
    } catch (err) {
        console.error('Failed to start camera', err);
        return false;
    }
}

function stopCamera() {
    if (stream) {
        stream.getTracks().forEach(track => track.stop());
        stream = null;
    }
    if (video.srcObject) {
        video.srcObject = null;
    }
    video.style.display = 'none'; // Hide video when stopped
}




async function getInstructionsAndFeedback(poseName) {
    try {
        const response = await fetch('/get_instructions', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ 
                pose_name: poseName,
                language: 'en'
            })
        });
        
        const data = await response.json();
        if (data.error) return null;
        
        return {
            instructions: data.instructions,
            feedback: data.feedback
        };
    } catch (error) {
        console.error('Error fetching instructions:', error);
        return null;
    }
}

async function getPoseBenefits(poseName) {
    try {
        console.log('Fetching benefits via Gemini for pose:', poseName);
        const response = await fetch('/get_pose_benefits', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ 
                pose_name: poseName,
                language: 'en'
            })
        });
        
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const data = await response.json();
        console.log('Gemini API response:', data);
        
        if (data.error) {
            console.error('API error:', data.error);
            return null;
        }
        
        return {
            benefits: data.benefits,
            contraindications: data.contraindications
        };
    } catch (error) {
        console.error('Error fetching pose benefits from Gemini:', error);
        return null;
    }
}

async function getBodyMeasurements(poseName, landmarks) {
    try {
        const response = await fetch('/get_body_measurements', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ 
                pose_name: poseName,
                landmarks: landmarks
            })
        });
        
        // Silently handle 404 - endpoint not implemented
        if (response.status === 404) {
            return null;
        }
        
        const data = await response.json();
        if (data.error) return null;
        
        return data;
    } catch (error) {
        // Silently fail - this is an optional feature
        return null;
    }
}

function updateInstructions(instructions) {
    if (instructions) {
        const lines = instructions.split('\n').filter(line => line.trim());
        instructionsList.innerHTML = '';
        
        lines.forEach(line => {
            if (line.trim().startsWith('-') || line.trim().startsWith('*')) {
                const li = document.createElement('li');
                li.textContent = line.trim().substring(1).trim();
                instructionsList.appendChild(li);
            } else if (line.trim()) {
                const li = document.createElement('li');
                li.textContent = line.trim();
                instructionsList.appendChild(li);
            }
        });
    }
}


function getPoseInfo(poseName) {
    return poseNames[poseName] || {
        english: poseName,
        sanskrit: poseName,
        full: poseName
    };
}

// Get pose data from asana_data.json
function getPoseDataFromJSON(poseName) {
    if (!asanaData) {
        console.log('Asana data not loaded yet');
        return null;
    }
    
    console.log('Looking for pose:', poseName);
    console.log('Available poses:', Object.keys(asanaData));
    
    // Try to find the pose in the JSON data with better matching
    for (const [key, data] of Object.entries(asanaData)) {
        const keyLower = key.toLowerCase();
        const poseLower = poseName.toLowerCase();
        
        // Extract key parts for better matching
        const keyParts = keyLower.split(/[_\s-]+/);
        const poseParts = poseLower.split(/[_\s-]+/);
        
        // Check for exact match first
        if (keyLower === poseLower) {
            console.log('Exact match found:', key);
            return data;
        }
        
        // Check if any key part matches any pose part
        const hasMatchingPart = keyParts.some(keyPart => 
            poseParts.some(posePart => 
                keyPart.includes(posePart) || posePart.includes(keyPart)
            )
        );
        
        // More flexible matching
        if (keyLower.includes(poseLower) || 
            poseLower.includes(keyLower) ||
            keyLower.replace(/[_\s-]/g, '').includes(poseLower.replace(/[_\s-]/g, '')) ||
            poseLower.replace(/[_\s-]/g, '').includes(keyLower.replace(/[_\s-]/g, '')) ||
            hasMatchingPart) {
            console.log('Found matching pose:', key);
            return data;
        }
    }
    
    console.log('No matching pose found for:', poseName);
    return null;
}

// Format benefits and warnings as bullet points
function formatAsBulletPoints(items) {
    if (!items || !Array.isArray(items)) return 'No information available.';
    
    return items.map(item => `• ${item}`).join('\n');
}

// Voice feedback functions - Using Google TTS (server-side)
async function speakPoseName(poseName, language = 'en') {
    if (isSpeaking || poseName === lastSpokenPose) {
        return; // Don't speak if already speaking or same pose
    }
    
    try {
        isSpeaking = true;
        lastSpokenPose = poseName;
        
        const traditionalName = getTraditionalName(poseName);
        console.log(`🎤 Speaking pose via Google TTS: ${traditionalName} in ${language}`);
        
        // Call server-side TTS endpoint
        const response = await fetch('/speak_feedback', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                pose_name: traditionalName,
                feedback: '',  // Empty feedback, only speak pose name
                language: language
            })
        });
        
        if (!response.ok) {
            throw new Error(`TTS request failed: ${response.status}`);
        }
        
        const data = await response.json();
        
        if (data.success) {
            console.log('✅ Pose name spoken via Google TTS');
        } else {
            console.error('❌ TTS failed:', data.message);
            isSpeaking = false;
        }
        
        // Reset speaking flag after estimated audio duration
        // Google TTS typically takes 1-3 seconds for pose names
        setTimeout(() => {
            isSpeaking = false;
        }, 3000);
        
    } catch (error) {
        console.error('❌ Error calling TTS endpoint:', error);
        isSpeaking = false;
        
        // Show user-friendly error message
        console.warn('⚠️ Voice feedback unavailable - continuing without audio');
    }
}

// Speak welcome message when page loads
async function speakWelcomeMessage(language = 'en') {
    try {
        console.log(`🎤 Speaking welcome message via Google TTS in ${language}`);
        
        // Call server-side TTS welcome endpoint
        const response = await fetch('/speak_welcome', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                language: language
            })
        });
        
        if (!response.ok) {
            throw new Error(`Welcome TTS request failed: ${response.status}`);
        }
        
        const data = await response.json();
        
        if (data.success) {
            console.log('✅ Welcome message spoken via Google TTS');
        } else {
            console.error('❌ Welcome TTS failed:', data.message);
        }
        
    } catch (error) {
        console.error('❌ Error calling welcome TTS endpoint:', error);
        console.warn('⚠️ Welcome message unavailable - continuing without audio');
    }
}

// Get traditional Sanskrit name for a pose (matches Python backend mapping)
function getTraditionalName(poseName) {
    const traditionalNames = {
        "Akarna_Dhanurasana": "Akarna Dhanurasana",
        "Bharadvajas_Twist_pose_or_Bharadvajasana_I_": "Bharadvajasana I",
        "Boat_Pose_or_Paripurna_Navasana_": "Paripurna Navasana",
        "Bound_Angle_Pose_or_Baddha_Konasana_": "Baddha Konasana",
        "Bow_Pose_or_Dhanurasana_": "Dhanurasana",
        "Bridge_Pose_or_Setu_Bandha_Sarvangasana_": "Setu Bandha Sarvangasana",
        "Camel_Pose_or_Ustrasana_": "Ustrasana",
        "Cat_Cow_Pose_or_Marjaryasana_": "Marjaryasana",
        "Chair_Pose_or_Utkatasana_": "Utkatasana",
        "Child_Pose_or_Balasana_": "Balasana",
        "Cobra_Pose_or_Bhujangasana_": "Bhujangasana",
        "Cockerel_Pose": "Kukkutasana",
        "Corpse_Pose_or_Savasana_": "Savasana",
        "Cow_Face_Pose_or_Gomukhasana_": "Gomukhasana",
        "Crane_(Crow)_Pose_or_Bakasana_": "Bakasana",
        "Dolphin_Plank_Pose_or_Makara_Adho_Mukha_Svanasana_": "Makara Adho Mukha Svanasana",
        "Dolphin_Pose_or_Ardha_Pincha_Mayurasana_": "Ardha Pincha Mayurasana",
        "Downward-Facing_Dog_pose_or_Adho_Mukha_Svanasana_": "Adho Mukha Svanasana",
        "Eagle_Pose_or_Garudasana_": "Garudasana",
        "Eight-Angle_Pose_or_Astavakrasana_": "Astavakrasana",
        "Extended_Puppy_Pose_or_Uttana_Shishosana_": "Uttana Shishosana",
        "Extended_Revolved_Side_Angle_Pose_or_Utthita_Parsvakonasana_": "Utthita Parsvakonasana",
        "Extended_Revolved_Triangle_Pose_or_Utthita_Trikonasana_": "Utthita Trikonasana",
        "Feathered_Peacock_Pose_or_Pincha_Mayurasana_": "Pincha Mayurasana",
        "Firefly_Pose_or_Tittibhasana_": "Tittibhasana",
        "Fish_Pose_or_Matsyasana_": "Matsyasana",
        "Four-Limbed_Staff_Pose_or_Chaturanga_Dandasana_": "Chaturanga Dandasana",
        "Frog_Pose_or_Bhekasana": "Bhekasana",
        "Garland_Pose_or_Malasana_": "Malasana",
        "Gate_Pose_or_Parighasana_": "Parighasana",
        "Half_Lord_of_the_Fishes_Pose_or_Ardha_Matsyendrasana_": "Ardha Matsyendrasana",
        "Half_Moon_Pose_or_Ardha_Chandrasana_": "Ardha Chandrasana",
        "Handstand_pose_or_Adho_Mukha_Vrksasana_": "Adho Mukha Vrksasana",
        "Happy_Baby_Pose_or_Ananda_Balasana_": "Ananda Balasana",
        "Head-to-Knee_Forward_Bend_pose_or_Janu_Sirsasana_": "Janu Sirsasana",
        "Heron_Pose_or_Krounchasana_": "Krounchasana",
        "Intense_Side_Stretch_Pose_or_Parsvottanasana_": "Parsvottanasana",
        "Legs-Up-the-Wall_Pose_or_Viparita_Karani_": "Viparita Karani",
        "Locust_Pose_or_Salabhasana_": "Salabhasana",
        "Lord_of_the_Dance_Pose_or_Natarajasana_": "Natarajasana",
        "Low_Lunge_pose_or_Anjaneyasana_": "Anjaneyasana",
        "Noose_Pose_or_Pasasana_": "Pasasana",
        "Peacock_Pose_or_Mayurasana_": "Mayurasana",
        "Pigeon_Pose_or_Kapotasana_": "Kapotasana",
        "Plank_Pose_or_Kumbhakasana_": "Kumbhakasana",
        "Plow_Pose_or_Halasana_": "Halasana",
        "Pose_Dedicated_to_the_Sage_Koundinya_or_Eka_Pada_Koundinyanasana_I_and_II": "Eka Pada Koundinyanasana",
        "Rajakapotasana": "Rajakapotasana",
        "Reclining_Hand-to-Big-Toe_Pose_or_Supta_Padangusthasana_": "Supta Padangusthasana",
        "Revolved_Head-to-Knee_Pose_or_Parivrtta_Janu_Sirsasana_": "Parivrtta Janu Sirsasana",
        "Scale_Pose_or_Tolasana_": "Tolasana",
        "Scorpion_pose_or_vrischikasana": "Vrischikasana",
        "Seated_Forward_Bend_pose_or_Paschimottanasana_": "Paschimottanasana",
        "Shoulder-Pressing_Pose_or_Bhujapidasana_": "Bhujapidasana",
        "Side-Reclining_Leg_Lift_pose_or_Anantasana_": "Anantasana",
        "Side_Crane_(Crow)_Pose_or_Parsva_Bakasana_": "Parsva Bakasana",
        "Side_Plank_Pose_or_Vasisthasana_": "Vasisthasana",
        "Sitting pose 1 (normal)": "Sukhasana",
        "Split pose": "Hanumanasana",
        "Staff_Pose_or_Dandasana_": "Dandasana",
        "Standing_Forward_Bend_pose_or_Uttanasana_": "Uttanasana",
        "Standing_Split_pose_or_Urdhva_Prasarita_Eka_Padasana_": "Urdhva Prasarita Eka Padasana",
        "Standing_big_toe_hold_pose_or_Utthita_Padangusthasana": "Utthita Padangusthasana",
        "Supported_Headstand_pose_or_Salamba_Sirsasana_": "Salamba Sirsasana",
        "Supported_Shoulderstand_pose_or_Salamba_Sarvangasana_": "Salamba Sarvangasana",
        "Supta_Baddha_Konasana_": "Supta Baddha Konasana",
        "Supta_Virasana_Vajrasana": "Supta Virasana",
        "Tortoise_Pose": "Kurmasana",
        "Tree_Pose_or_Vrksasana_": "Vrksasana",
        "Upward_Bow_(Wheel)_Pose_or_Urdhva_Dhanurasana_": "Urdhva Dhanurasana",
        "Upward_Facing_Two-Foot_Staff_Pose_or_Dwi_Pada_Viparita_Dandasana_": "Dwi Pada Viparita Dandasana",
        "Upward_Plank_Pose_or_Purvottanasana_": "Purvottanasana",
        "Virasana_or_Vajrasana": "Vajrasana",
        "Warrior_III_Pose_or_Virabhadrasana_III_": "Virabhadrasana III",
        "Warrior_II_Pose_or_Virabhadrasana_II_": "Virabhadrasana II",
        "Warrior_I_Pose_or_Virabhadrasana_I_": "Virabhadrasana I",
        "Wide-Angle_Seated_Forward_Bend_pose_or_Upavistha_Konasana_": "Upavistha Konasana",
        "Wide-Legged_Forward_Bend_pose_or_Prasarita_Padottanasana_": "Prasarita Padottanasana",
        "Wild_Thing_pose_or_Camatkarasana_": "Camatkarasana",
        "Wind_Relieving_pose_or_Pawanmuktasana": "Pawanmuktasana",
        "Yogic_sleep_pose": "Yoga Nidra",
        "viparita_virabhadrasana_or_reverse_warrior_pose": "Viparita Virabhadrasana"
    };
    
    return traditionalNames[poseName] || poseName;
}

async function updatePoseDisplay(poseName, confidence, landmarks = null) {
    const poseInfo = getPoseInfo(poseName);
    const confidencePercent = Math.round(confidence * 100);
    
    // Always update analysis box with current data
    confidenceValueAnalysis.textContent = confidencePercent + '%';
    confidenceBarAnalysis.style.width = confidencePercent + '%';
    
    // Update body angles - try to get real measurements if landmarks available
    if (landmarks && confidence >= 0.85) {
        try {
            const measurements = await getBodyMeasurements(poseName, landmarks);
            if (measurements) {
                updateBodyAngles(poseName, confidence, measurements);
            } else {
    updateBodyAngles(poseName, confidence);
            }
        } catch (error) {
            console.error('Error getting body measurements:', error);
            updateBodyAngles(poseName, confidence);
        }
    } else {
        updateBodyAngles(poseName, confidence);
    }
    
    // Only show pose names if accuracy is 85% and above
    if (confidence >= 0.85) {
        // Get traditional name from the backend mapping
        const traditionalName = getTraditionalName(poseName);
        
        // Update main pose name with traditional Sanskrit name only
        poseNameEl.textContent = traditionalName;
        
        // Update analysis box - show English name in analysis box
        poseNameFull.textContent = poseInfo.english || poseName;
        sanskritName.textContent = traditionalName;
        
        // Set current pose for info buttons - use the original pose name for JSON matching
        currentPoseForInfo = poseName;
        console.log('Current pose set for info:', currentPoseForInfo);
        
        // Update benefits information
        updateBenefitsInfo(poseInfo);
        
        // Show accuracy in bottom bar
        confidenceValueBottom.textContent = confidencePercent + '%';
        detectionAccuracy.style.display = 'flex';
        
        // Immediate voice feedback for pose detection
        if (poseName !== lastSpokenPose) {
            speakPoseName(poseName, currentLanguage);
        }
    } else {
        // Hide pose names and accuracy when below 85%
        poseNameEl.textContent = '—';
        poseNameFull.textContent = '—';
        sanskritName.textContent = '—';
        detectionAccuracy.style.display = 'none';
        
        // Clear benefits info
        benefitsText.textContent = 'Start session to see pose benefits';
        contraindicationsText.style.display = 'none';
        currentPoseForInfo = null;
    }
}

function updateBodyAngles(poseName, confidence, measurements = null) {
    if (measurements) {
        // Use real measurements from API
        spineAngle.textContent = measurements.spine_angle + '°';
        kneeAngle.textContent = measurements.knee_angle + '°';
        hipAngle.textContent = measurements.hip_angle + '°';
        shoulderAngle.textContent = measurements.shoulder_angle + '°';
        armSpan.textContent = measurements.arm_span + ' cm';
        legLength.textContent = measurements.leg_length + ' cm';
        torsoLength.textContent = measurements.torso_length + ' cm';
        balanceScore.textContent = measurements.balance_score + '%';
    } else {
        // Fallback to simulated measurements
    const angles = calculateBodyAngles(poseName, confidence);
    spineAngle.textContent = angles.spine + '°';
    kneeAngle.textContent = angles.knee + '°';
    hipAngle.textContent = angles.hip + '°';
    shoulderAngle.textContent = angles.shoulder + '°';
        armSpan.textContent = angles.arm_span + ' cm';
        legLength.textContent = angles.leg_length + ' cm';
        torsoLength.textContent = angles.torso_length + ' cm';
        balanceScore.textContent = angles.balance_score + '%';
    }
}

function calculateBodyAngles(poseName, confidence) {
    // Simulate angle calculations based on pose type
    const baseAngles = {
        spine: Math.round(180 + (Math.random() - 0.5) * 20),
        knee: Math.round(90 + (Math.random() - 0.5) * 30),
        hip: Math.round(90 + (Math.random() - 0.5) * 20),
        shoulder: Math.round(90 + (Math.random() - 0.5) * 15),
        arm_span: Math.round(150 + (Math.random() - 0.5) * 20),
        leg_length: Math.round(80 + (Math.random() - 0.5) * 15),
        torso_length: Math.round(50 + (Math.random() - 0.5) * 10),
        balance_score: Math.round(85 + (Math.random() - 0.5) * 15)
    };
    
    // Adjust based on pose type
    if (poseName.includes('Tree') || poseName.includes('Vrksasana')) {
        baseAngles.knee = Math.round(45 + Math.random() * 20);
        baseAngles.hip = Math.round(60 + Math.random() * 20);
        baseAngles.balance_score = Math.round(70 + Math.random() * 20);
    } else if (poseName.includes('Warrior')) {
        baseAngles.knee = Math.round(90 + Math.random() * 30);
        baseAngles.hip = Math.round(45 + Math.random() * 30);
        baseAngles.balance_score = Math.round(80 + Math.random() * 15);
    } else if (poseName.includes('Child') || poseName.includes('Balasana')) {
        baseAngles.spine = Math.round(90 + Math.random() * 20);
        baseAngles.knee = Math.round(45 + Math.random() * 15);
        baseAngles.balance_score = Math.round(90 + Math.random() * 10);
    }
    
    return baseAngles;
}

function updateBenefitsInfo(poseInfo) {
    // Update current pose for info buttons
    currentPoseForInfo = poseInfo.english || poseInfo.full || poseInfo.sanskrit;
    
    // Store pose info for later use - use local data for instant availability
    if (poseInfo.benefits) {
        benefitsText.textContent = poseInfo.benefits;
    }
    if (poseInfo.contraindications) {
        contraindicationsText.textContent = poseInfo.contraindications;
    }
}


async function captureAndPredict() {
    if (!video.videoWidth || !video.videoHeight) return;

    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    const ctx = canvas.getContext('2d');
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

    const blob = await new Promise(resolve => canvas.toBlob(resolve, 'image/jpeg', 0.7));
    const form = new FormData();
    form.append('file', new File([blob], 'frame.jpg', { type: 'image/jpeg' }));

    try {
        const res = await fetch('/predict', { method: 'POST', body: form });
        
        // Check if response is ok
        if (!res.ok) {
            console.error('Prediction request failed:', res.status, res.statusText);
            handleTrackingLoss();
            return;
        }
        
        const data = await res.json();
        
        // Check for errors in response
        if (data.error) {
            console.error('Prediction error:', data.error);
            handleTrackingLoss();
            return;
        }
        
        // Check if pose detection failed (no landmarks detected)
        if (!data.pose || data.pose === 'unknown' || data.pose === 'no_pose_detected') {
            console.warn('No pose detected in frame');
            handleTrackingLoss();
            return;
        }
        
        // Successful detection - handle tracking recovery if needed
        if (trackingLossDetected) {
            handleTrackingRecovery();
        }
        
        console.log(`🎯 Detected pose: ${data.pose} with ${Math.round(data.confidence * 100)}% confidence`);
        
        // Call detectPoseTransition() for each valid detection
        const transitionData = detectPoseTransition(data.pose, data.confidence);
        
        // Call handlePoseTransition() with transition result
        await handlePoseTransition(transitionData);
        
        // Update UI for all detections (even low confidence ones for visual feedback)
        // For now, we'll use simulated landmarks since we need to extract them from MediaPipe
        // In a real implementation, you would extract landmarks from the MediaPipe results
        const simulatedLandmarks = generateSimulatedLandmarks(data.pose, data.confidence);
        await updatePoseDisplay(data.pose, data.confidence, simulatedLandmarks);
        
        // Update current pose for info buttons (only for high confidence detections)
        if (data.confidence >= MIN_CONFIDENCE_FOR_LOGGING) {
            currentPoseForInfo = data.pose;
        }
        
        // Preserve voice feedback functionality
        // Optimized pose confirmation logic - only announce when accuracy >= 85%
        if (data.confidence >= MIN_CONFIDENCE_FOR_LOGGING) {
            if (data.pose === currentPose) {
                if (poseStartTime && (Date.now() - poseStartTime) >= POSE_CONFIRMATION_TIME) {
                    if (data.pose !== lastAnnouncedPose) {
                        lastAnnouncedPose = data.pose;
                        
                        // Get instructions and feedback in parallel for speed
                        const instructionsData = await getInstructionsAndFeedback(data.pose);
                        if (instructionsData) {
                            updateInstructions(instructionsData.instructions);
                        }
                        
                        // Reset timer for next pose
                        poseStartTime = Date.now();
                    }
                }
            } else {
                // New pose detected, reset timer for voice feedback
                currentPose = data.pose;
                poseStartTime = Date.now();
                lastAnnouncedPose = null;
            }
        }
        
    } catch (e) {
        console.error('Error in captureAndPredict:', e);
        handleTrackingLoss();
    }
}

function generateSimulatedLandmarks(poseName, confidence) {
    // Generate simulated landmarks for testing
    // In a real implementation, these would come from MediaPipe pose detection
    const landmarks = [];
    for (let i = 0; i < 33; i++) {
        landmarks.push([
            Math.random() * 2 - 1,  // x coordinate
            Math.random() * 2 - 1,  // y coordinate
            Math.random() * 2 - 1   // z coordinate
        ]);
    }
    return landmarks.flat();
}

function startLoop() {
    if (loopHandle) return;
    poseStartTime = Date.now();
    lastAnnouncedPose = null;
    
    captureAndPredict();
    loopHandle = setInterval(captureAndPredict, CAPTURE_MS);
}

function stopLoop() {
    if (loopHandle) {
        clearInterval(loopHandle);
        loopHandle = null;
    }
}

function resetUI() {
    poseNameEl.textContent = '—';
    poseNameFull.textContent = '—';
    sanskritName.textContent = '—';
    confidenceValueBottom.textContent = '—';
    confidenceValueAnalysis.textContent = '—';
    confidenceBarAnalysis.style.width = '0%';
    detectionAccuracy.style.display = 'none';
    instructionsList.innerHTML = '<li>Start session to see pose instructions</li>';
    
    // Reset body measurements
    spineAngle.textContent = '—';
    kneeAngle.textContent = '—';
    hipAngle.textContent = '—';
    shoulderAngle.textContent = '—';
    armSpan.textContent = '—';
    legLength.textContent = '—';
    torsoLength.textContent = '—';
    balanceScore.textContent = '—';
    
    // Reset panel content
    benefitsContent.style.display = 'none';
    contraindicationsContent.style.display = 'none';
    instructionsList.style.display = 'block';
    panelTitle.textContent = '📋 Pose Instructions';
    
    // Reset button states
    benefitsBtn.classList.remove('active');
    
    // Reset visibility states
    benefitsVisible = false;
    
    poseStartTime = null;
    lastAnnouncedPose = null;
    currentPoseForInfo = null;
    
    // Reset pose state manager
    poseStateManager.initializePoseState();
    console.log('🔄 UI and pose state reset');
}

startBtn.addEventListener('click', async () => {
    // Start camera first
    const cameraStarted = await startCamera();
    if (cameraStarted) {
        // Initialize session tracking
        sessionActive = true;
        sessionId = generateSessionId();
        sessionStartTime = new Date();
        detectedPoses.clear();
        poseDetectionCount = 0;
        loggedPosesInSession = []; // Reset logged poses tracking
        
        // Initialize pose state for deduplication tracking
        poseStateManager.initializePoseState();
        
        console.log('\n🎯 ========== SESSION STARTED ==========');
        console.log(`Session ID: ${sessionId}`);
        console.log(`Timestamp: ${sessionStartTime.toISOString()}`);
        console.log('==========================================\n');
        
        startLoop();
        startBtn.disabled = true;
        stopBtn.disabled = false;
    }
});

stopBtn.addEventListener('click', async () => {
    console.log('\n🛑 ========== STOP BUTTON CLICKED ==========');
    console.log(`Session Active: ${sessionActive}`);
    console.log(`Current Asana: ${poseStateManager.currentAsana}`);
    console.log(`Duration: ${poseStateManager.getDuration()}s`);
    console.log(`Confidence Readings: ${poseStateManager.confidenceReadings.length}`);
    console.log(`Last Logged: ${poseStateManager.lastLoggedPose}`);
    console.log('==========================================\n');
    
    stopLoop();
    stopCamera(); // Stop the webcam when end session is pressed
    
    // Clean up tracking loss state
    if (trackingLossTimeout) {
        clearTimeout(trackingLossTimeout);
        trackingLossTimeout = null;
    }
    trackingLossDetected = false;
    trackingLossStartTime = null;
    hideTrackingLossIndicator();
    
    // Save session data before resetting
    if (sessionActive) {
        console.log('📝 Attempting to log final pose...');
        // Log the final pose if user is holding one
        await logFinalPoseOnSessionEnd();
        
        await saveSessionData();
        sessionActive = false;
        console.log('✅ Session ended and saved');
    } else {
        console.log('⚠️ Session not active - skipping final pose logging');
    }
    
    resetUI();
    // Enable start button for restart
    startBtn.disabled = false;
    stopBtn.disabled = true;
});

// Toggle panel functionality
let panelVisible = false;

togglePanelBtn.addEventListener('click', () => {
    panelVisible = !panelVisible;
    if (panelVisible) {
        instructionsPanel.classList.add('show');
        togglePanelBtn.textContent = 'Hide Instructions';
        
        // Show instructions by default
        instructionsList.style.display = 'block';
        benefitsContent.style.display = 'none';
        contraindicationsContent.style.display = 'none';
        panelTitle.textContent = '📋 Pose Instructions';
        
        // Reset button states
        benefitsBtn.classList.remove('active');
        benefitsVisible = false;
    } else {
        instructionsPanel.classList.remove('show');
        togglePanelBtn.textContent = 'Show Instructions';
    }
});

// Info buttons functionality
let benefitsVisible = false;
let currentPoseForInfo = null;

benefitsBtn.addEventListener('click', async () => {
    benefitsVisible = !benefitsVisible;
    if (benefitsVisible) {
        // Show instructions panel
        instructionsPanel.classList.add('show');
        panelVisible = true;
        togglePanelBtn.textContent = 'Hide Instructions';
        
        // Hide other content
        instructionsList.style.display = 'none';
        contraindicationsContent.style.display = 'none';
        
        // Show benefits content
        benefitsContent.style.display = 'block';
        panelTitle.textContent = '💪 Pose Benefits';
        
        if (currentPoseForInfo) {
            try {
                console.log('Fetching benefits for pose:', currentPoseForInfo);
                benefitsText.textContent = 'Loading benefits...';
                
                // First try to get data from asana_data.json
                const jsonData = getPoseDataFromJSON(currentPoseForInfo);
                console.log('JSON data for benefits:', jsonData);
                if (jsonData && jsonData.benefits && jsonData.benefits.length > 0) {
                    console.log('Using JSON benefits:', jsonData.benefits);
                    benefitsText.textContent = formatAsBulletPoints(jsonData.benefits);
                } else {
                    // Fallback to Gemini API
                    const benefitsData = await getPoseBenefits(currentPoseForInfo);
                    console.log('Benefits data received:', benefitsData);
                    if (benefitsData && benefitsData.benefits) {
                        benefitsText.textContent = benefitsData.benefits;
                    } else {
                        // Fallback to local data
                        const poseInfo = getPoseInfo(currentPoseForInfo);
                        if (poseInfo.benefits) {
                            benefitsText.textContent = poseInfo.benefits;
                        } else {
                            benefitsText.textContent = 'No benefits information available.';
                        }
                    }
                }
            } catch (error) {
                console.error('Error loading benefits:', error);
                // Fallback to local data
                const poseInfo = getPoseInfo(currentPoseForInfo);
                if (poseInfo.benefits) {
                    benefitsText.textContent = poseInfo.benefits;
                } else {
                    benefitsText.textContent = 'Error loading benefits. Please try again.';
                }
            }
        } else {
            console.log('No current pose for info');
            benefitsText.textContent = 'No pose detected. Please start a session.';
        }
        benefitsBtn.classList.add('active');
    } else {
        benefitsContent.style.display = 'none';
        benefitsBtn.classList.remove('active');
    }
});




// Language selection event listener
languageSelect.addEventListener('change', (e) => {
    currentLanguage = e.target.value;
    console.log('Language changed to:', currentLanguage);
});

// Initialize with default state
startBtn.disabled = false;
stopBtn.disabled = true;

// Add these variables at the top



// Generate unique session ID
function generateSessionId() {
    return 'session_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
}

// ============================================================================
// SESSION LIFECYCLE MANAGEMENT
// ============================================================================

/**
 * Log the final pose when session ends
 * This ensures that the last pose being held is logged before session cleanup
 * Requirements: 3.4, 7.3
 */
async function logFinalPoseOnSessionEnd() {
    // Check if user is currently holding a pose
    if (!poseStateManager.currentAsana) {
        console.log('ℹ️ No pose being held at session end');
        return;
    }
    
    const duration = poseStateManager.getDuration();
    const averageConfidence = poseStateManager.getAverageConfidence();
    
    console.log(`🏁 Session ending - checking final pose: ${poseStateManager.currentAsana}`);
    console.log(`   Duration: ${duration}s, Average Confidence: ${Math.round(averageConfidence * 100)}%`);
    console.log(`   Last logged pose: ${poseStateManager.lastLoggedPose || 'none'}`);
    
    // SIMPLIFIED: Check if ANY confidence reading was >= 85%
    const hasHighConfidenceReading = poseStateManager.confidenceReadings.some(c => c >= MIN_CONFIDENCE_FOR_LOGGING);
    
    if (!hasHighConfidenceReading) {
        console.log(`⚠️ Final pose has low confidence - skipping`);
        console.log(`   No readings >= 85% detected`);
        return;
    }
    
    // Check if this pose is different from the last logged pose (prevent duplicates)
    const isDifferentFromLastLogged = poseStateManager.currentAsana !== poseStateManager.lastLoggedPose;
    
    if (!isDifferentFromLastLogged) {
        console.log(`⚠️ Final pose is same as last logged pose - skipping to prevent duplicate`);
        return;
    }
    
    // Only log if pose meets minimum duration requirement
    if (duration >= 2) {
        const poseData = {
            name: poseStateManager.currentAsana,
            duration: duration,
            averageConfidence: averageConfidence,
            meetsMinimumDuration: true
        };
        
        console.log(`📝 Logging final pose before session end`);
        console.log(`   ✓ Has high confidence readings: YES`);
        console.log(`   ✓ Duration: ${duration}s (>= 2s)`);
        console.log(`   ✓ Different from last logged: YES`);
        
        const logResult = await logPoseToDatabase(poseData);
        
        // Mark as logged if successful
        if (logResult) {
            poseStateManager.markPoseAsLogged(poseStateManager.currentAsana);
        }
    } else {
        console.log(`⏭️ Final pose held for only ${duration}s - not logging (minimum: 2s)`);
    }
}

/**
 * Log current pose before browser close or page unload
 * This prevents data loss when user closes browser during a session
 * Requirements: 3.4, 7.3
 */
async function logCurrentPoseBeforeExit() {
    // Only log if session is active and user is holding a pose
    if (!sessionActive || !poseStateManager.currentAsana) {
        return;
    }
    
    const duration = poseStateManager.getDuration();
    const averageConfidence = poseStateManager.getAverageConfidence();
    
    console.log(`⚠️ Browser closing - attempting to log current pose: ${poseStateManager.currentAsana}`);
    console.log(`   Duration: ${duration}s, Average Confidence: ${Math.round(averageConfidence * 100)}%`);
    console.log(`   Last logged pose: ${poseStateManager.lastLoggedPose || 'none'}`);
    
    // CRITICAL: Check if average confidence meets threshold (>= 85%)
    if (averageConfidence < MIN_CONFIDENCE_FOR_LOGGING) {
        console.log(`⚠️ Current pose has low confidence - skipping`);
        console.log(`   Average Confidence: ${Math.round(averageConfidence * 100)}% (minimum: 85%)`);
        return;
    }
    
    // Check if this pose is different from the last logged pose (prevent duplicates)
    const isDifferentFromLastLogged = poseStateManager.currentAsana !== poseStateManager.lastLoggedPose;
    
    if (!isDifferentFromLastLogged) {
        console.log(`⚠️ Current pose is same as last logged pose - skipping to prevent duplicate`);
        return;
    }
    
    // Only log if pose meets minimum duration requirement
    if (duration >= 2) {
        const poseData = {
            name: poseStateManager.currentAsana,
            duration: duration,
            averageConfidence: averageConfidence,
            meetsMinimumDuration: true
        };
        
        // Use synchronous approach for beforeunload (async may not complete)
        // Send beacon API for reliable delivery during page unload
        const payload = {
            pose_name: poseData.name,
            confidence: poseData.averageConfidence,
            duration_seconds: poseData.duration,
            session_id: sessionId,
            timestamp: new Date().toISOString()
        };
        
        try {
            // Use sendBeacon for reliable delivery during unload
            const blob = new Blob([JSON.stringify(payload)], { type: 'application/json' });
            const sent = navigator.sendBeacon('/api/log_activity', blob);
            
            if (sent) {
                console.log(`✅ Final pose logged via beacon: ${poseData.name} (${duration}s, ${Math.round(averageConfidence * 100)}%)`);
                // Note: We can't mark as logged here since the page is unloading
            } else {
                console.warn(`⚠️ Failed to send beacon for final pose`);
            }
        } catch (error) {
            console.error(`❌ Error logging pose before exit:`, error);
        }
    }
}

// Save session data to database
async function saveSessionData() {
    if (!currentUserId || !sessionId) {
        console.warn('Cannot save session: missing user ID or session ID');
        return;
    }
    
    try {
        const sessionDuration = Math.floor((new Date() - sessionStartTime) / 1000); // in seconds
        const uniquePoses = detectedPoses.size;
        const totalDetections = poseDetectionCount;
        
        console.log('💾 Saving session data:', {
            sessionId,
            duration: sessionDuration,
            uniquePoses,
            totalDetections,
            poses: Array.from(detectedPoses.keys())
        });
        
        // Session data is already logged via individual pose detections
        // This is just a summary log
        console.log(`✅ Session summary: ${totalDetections} poses detected, ${uniquePoses} unique poses, ${sessionDuration}s duration`);
        
    } catch (error) {
        console.error('Error saving session data:', error);
    }
}

// ============================================================================
// END SESSION LIFECYCLE MANAGEMENT
// ============================================================================

// Set current user ID (called from webcam.html)
function setCurrentUserId(userId) {
    currentUserId = userId;
    console.log('Webcam session started for user:', userId);
}

// Debug function to print session summary
window.printSessionSummary = function() {
    console.log(`\n📊 ========== SESSION SUMMARY ==========`);
    console.log(`Session ID: ${sessionId}`);
    console.log(`Session Active: ${sessionActive}`);
    console.log(`Total Logged: ${loggedPosesInSession.length}`);
    console.log(`\nLogged Poses:`);
    loggedPosesInSession.forEach((entry, index) => {
        console.log(`${index + 1}. ${entry.pose} - ${entry.duration}s - ${entry.confidence}% - ${entry.timestamp}`);
    });
    console.log(`\nCurrent State:`);
    console.log(`  Current Asana: ${poseStateManager.currentAsana}`);
    console.log(`  Last Logged: ${poseStateManager.lastLoggedPose}`);
    console.log(`  Duration: ${poseStateManager.getDuration()}s`);
    console.log(`==========================================\n`);
};

// ============================================================================
// DATABASE LOGGING - Refactored to prevent duplicates
// ============================================================================

/**
 * Log pose to database with single-entry-per-hold logic
 * This function implements the core deduplication logic by validating that
 * poses meet minimum duration requirements before logging.
 * 
 * Requirements: 5.1, 5.2, 5.4, 6.2, 6.3, 6.4
 * 
 * @param {object} poseData - Pose data object containing:
 *   - name: Pose name (string)
 *   - duration: Hold duration in seconds (number)
 *   - averageConfidence: Average confidence during hold (0-1)
 *   - meetsMinimumDuration: Boolean indicating if pose meets 2s minimum
 * @returns {Promise<string|null>} Activity ID if logged, null if skipped
 */
async function logPoseToDatabase(poseData) {
    // Validate session is active
    if (!currentUserId || !sessionActive) {
        console.warn('⚠️ Cannot log pose: session not active or user not logged in');
        return null;
    }
    
    // Validate pose data structure
    if (!poseData || !poseData.name) {
        console.error('⚠️ Invalid pose data provided to logPoseToDatabase');
        return null;
    }
    
    // Validate pose meets minimum duration requirement (2 seconds)
    // This is the core deduplication logic - only log poses held long enough
    if (!poseData.meetsMinimumDuration) {
        const confidencePercent = Math.round(poseData.averageConfidence * 100);
        console.log(`⏭️ SKIPPING POSE - Below minimum duration`);
        console.log(`   Pose: ${poseData.name}`);
        console.log(`   Duration: ${poseData.duration}s (minimum required: 2s)`);
        console.log(`   Average Confidence: ${confidencePercent}%`);
        console.log(`   Reason: Rapid transition or brief hold`);
        return null;
    }
    
    // Additional safety check for duration
    if (poseData.duration < 2) {
        const confidencePercent = Math.round(poseData.averageConfidence * 100);
        console.log(`⏭️ SKIPPING POSE - Duration check failed`);
        console.log(`   Pose: ${poseData.name}`);
        console.log(`   Duration: ${poseData.duration}s (minimum required: 2s)`);
        console.log(`   Average Confidence: ${confidencePercent}%`);
        return null;
    }
    
    // Format payload with pose name, average confidence, duration, session_id
    const payload = {
        pose_name: poseData.name,
        confidence: poseData.averageConfidence,  // Average confidence over the hold
        duration_seconds: poseData.duration,      // Total hold duration
        session_id: sessionId,
        timestamp: new Date().toISOString()
    };
    
    const confidencePercent = Math.round(poseData.averageConfidence * 100);
    
    console.log(`\n💾 ========== LOGGING TO DATABASE ==========`);
    console.log(`   Pose: ${poseData.name}`);
    console.log(`   Duration: ${poseData.duration}s`);
    console.log(`   Average Confidence: ${confidencePercent}%`);
    console.log(`   Session ID: ${sessionId}`);
    console.log(`   Timestamp: ${payload.timestamp}`);
    
    // Track this logging attempt
    loggedPosesInSession.push({
        pose: poseData.name,
        duration: poseData.duration,
        confidence: confidencePercent,
        timestamp: new Date().toISOString()
    });
    
    console.log(`   Total logged this session: ${loggedPosesInSession.length}`);
    console.log(`==========================================\n`);
    
    // Implement async logging with error handling
    try {
        const response = await fetch('/api/log_activity', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(payload)
        });
        
        if (response.ok) {
            const result = await response.json();
            poseDetectionCount++;
            
            // Add success logging with pose details
            console.log(`✅ DATABASE RESPONSE: SUCCESS`);
            console.log(`   Activity ID: ${result.activity_id || result._id || 'unknown'}`);
            console.log(`   Total logged: ${poseDetectionCount}`);
            
            // Update showActivityIndicator() to show duration in notification
            showActivityIndicator(poseData.name, poseData.averageConfidence, poseData.duration);
            
            return result.activity_id || result._id || 'logged';
        } else {
            // Add failure logging with pose details
            console.error(`❌ DATABASE RESPONSE: FAILED`);
            console.error(`   HTTP Status: ${response.status}`);
            
            const errorText = await response.text();
            console.error(`   Error details: ${errorText}`);
            return null;
        }
    } catch (error) {
        // Add failure logging with pose details
        console.error(`❌ DATABASE ERROR: ${error.message}`);
        return null;
    }
}

/**
 * Legacy function name for backward compatibility
 * Redirects to logPoseToDatabase
 * @deprecated Use logPoseToDatabase instead
 */
async function logPoseDetection(poseData) {
    return await logPoseToDatabase(poseData);
}

// ============================================================================
// END DATABASE LOGGING
// ============================================================================

/**
 * Show activity indicator notification
 * Displays a notification when a pose is logged to the database
 * 
 * @param {string} poseName - Name of the pose
 * @param {number} confidence - Average confidence (0-1)
 * @param {number} duration - Hold duration in seconds (optional)
 */
function showActivityIndicator(poseName, confidence, duration = null) {
    let indicator = document.getElementById('activity-indicator');
    
    if (!indicator) {
        // Create indicator if it doesn't exist
        indicator = document.createElement('div');
        indicator.id = 'activity-indicator';
        indicator.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            background: linear-gradient(135deg, #51cf66, #40c057);
            color: white;
            padding: 12px 18px;
            border-radius: 8px;
            z-index: 1000;
            box-shadow: 0 4px 15px rgba(81, 207, 102, 0.3);
            font-weight: 500;
            animation: slideInRight 0.3s ease;
            font-size: 14px;
            line-height: 1.4;
        `;
        document.body.appendChild(indicator);
        
        // Add CSS animation
        const style = document.createElement('style');
        style.textContent = `
            @keyframes slideInRight {
                from {
                    transform: translateX(100%);
                    opacity: 0;
                }
                to {
                    transform: translateX(0);
                    opacity: 1;
                }
            }
            @keyframes fadeOut {
                from {
                    opacity: 1;
                }
                to {
                    opacity: 0;
                }
            }
        `;
        document.head.appendChild(style);
    }
    
    const traditionalName = getTraditionalName(poseName);
    const confidencePercent = Math.round(confidence * 100);
    
    // Include duration in the notification if provided
    if (duration !== null && duration > 0) {
        indicator.innerHTML = `
            <div style="font-weight: 600; margin-bottom: 2px;">✅ Pose Logged</div>
            <div style="font-size: 13px;">${traditionalName}</div>
            <div style="font-size: 12px; opacity: 0.9; margin-top: 2px;">
                ${duration}s hold • ${confidencePercent}% confidence
            </div>
        `;
    } else {
        indicator.textContent = `✅ Logged: ${traditionalName} (${confidencePercent}%)`;
    }
    
    indicator.style.display = 'block';
    indicator.style.animation = 'slideInRight 0.3s ease';
    
    // Fade out after 2.5 seconds, then hide after 3 seconds
    setTimeout(() => {
        indicator.style.animation = 'fadeOut 0.5s ease';
    }, 2500);
    
    setTimeout(() => {
        indicator.style.display = 'none';
    }, 3000);
}

// Load asana data from JSON file
async function loadAsanaData() {
    try {
        const response = await fetch('/static/asana_data.json');
        if (!response.ok) {
            throw new Error('Failed to load asana data');
        }
        asanaData = await response.json();
        console.log('Asana data loaded successfully');
        console.log('Available poses:', Object.keys(asanaData));
        
        // Test with a known pose
        const testPose = 'Tree_Pose_or_Vrksasana_';
        if (asanaData[testPose]) {
            console.log('Test pose data:', asanaData[testPose]);
        }
    } catch (error) {
        console.error('Error loading asana data:', error);
        asanaData = null;
    }
}

// Load user profile data
async function loadUserProfile() {
    try {
        const response = await fetch('/api/current_user');
        if (response.ok) {
            const userData = await response.json();
            
            // Update user profile display
            const userNameElement = document.getElementById('userNameWebcam');
            const userEmailElement = document.getElementById('userEmailWebcam');
            const userAvatarElement = document.getElementById('userAvatarWebcam');
            
            if (userNameElement) {
                userNameElement.textContent = userData.username || 'User';
            }
            if (userEmailElement) {
                userEmailElement.textContent = userData.email || 'user@example.com';
            }
            if (userAvatarElement) {
                if (userData.avatar && userData.avatar.trim() !== '') {
                    userAvatarElement.innerHTML = `<img src="${userData.avatar}" alt="Avatar" class="avatar-img">`;
                } else {
                    // Keep the placeholder but update it with user initials if available
                    const initials = userData.username ? userData.username.charAt(0).toUpperCase() : '👤';
                    userAvatarElement.innerHTML = `<div class="avatar-placeholder">${initials}</div>`;
                }
            }
            
            console.log('User profile loaded:', userData.username, 'Avatar:', userData.avatar);
        }
    } catch (error) {
        console.error('Error loading user profile:', error);
        // Set default values on error
        const userNameElement = document.getElementById('userNameWebcam');
        const userEmailElement = document.getElementById('userEmailWebcam');
        if (userNameElement) userNameElement.textContent = 'User';
        if (userEmailElement) userEmailElement.textContent = 'user@example.com';
    }
}

// ============================================================================
// TEST FUNCTIONS - For verifying PoseStateManager functionality
// ============================================================================

/**
 * Test the PoseStateManager class
 * Call from browser console: testPoseStateManager()
 */
window.testPoseStateManager = function() {
    console.log('🧪 Testing PoseStateManager...\n');
    
    // Test 1: Initialize state
    console.log('Test 1: Initialize state');
    poseStateManager.initializePoseState();
    console.log('State after init:', poseStateManager.getStateSummary());
    console.assert(poseStateManager.currentAsana === null, 'currentAsana should be null');
    console.assert(poseStateManager.previousAsana === null, 'previousAsana should be null');
    console.log('✅ Test 1 passed\n');
    
    // Test 2: Update state with first pose
    console.log('Test 2: Update state with first pose');
    poseStateManager.updateState('Tree_Pose_or_Vrksasana_', 0.92);
    console.log('State after first pose:', poseStateManager.getStateSummary());
    console.assert(poseStateManager.currentAsana === 'Tree_Pose_or_Vrksasana_', 'currentAsana should be Tree Pose');
    console.assert(poseStateManager.previousAsana === null, 'previousAsana should still be null');
    console.log('✅ Test 2 passed\n');
    
    // Test 3: Update same pose (should accumulate confidence)
    console.log('Test 3: Update same pose multiple times');
    poseStateManager.updateState('Tree_Pose_or_Vrksasana_', 0.89);
    poseStateManager.updateState('Tree_Pose_or_Vrksasana_', 0.91);
    console.log('State after multiple updates:', poseStateManager.getStateSummary());
    console.assert(poseStateManager.confidenceReadings.length === 3, 'Should have 3 confidence readings');
    console.log('✅ Test 3 passed\n');
    
    // Test 4: Transition to new pose
    console.log('Test 4: Transition to new pose');
    poseStateManager.updateState('Warrior_I_Pose_or_Virabhadrasana_I_', 0.88);
    console.log('State after transition:', poseStateManager.getStateSummary());
    console.assert(poseStateManager.currentAsana === 'Warrior_I_Pose_or_Virabhadrasana_I_', 'currentAsana should be Warrior I');
    console.assert(poseStateManager.previousAsana === 'Tree_Pose_or_Vrksasana_', 'previousAsana should be Tree Pose');
    console.log('✅ Test 4 passed\n');
    
    // Test 5: Reset current pose
    console.log('Test 5: Reset current pose');
    poseStateManager.resetCurrentPose();
    console.log('State after reset:', poseStateManager.getStateSummary());
    console.assert(poseStateManager.currentAsana === null, 'currentAsana should be null after reset');
    console.assert(poseStateManager.previousAsana === 'Tree_Pose_or_Vrksasana_', 'previousAsana should be preserved');
    console.log('✅ Test 5 passed\n');
    
    // Test 6: Get duration and average confidence
    console.log('Test 6: Duration and confidence calculations');
    poseStateManager.updateState('Child_Pose_or_Balasana_', 0.90);
    poseStateManager.updateState('Child_Pose_or_Balasana_', 0.85);
    poseStateManager.updateState('Child_Pose_or_Balasana_', 0.88);
    const avgConfidence = poseStateManager.getAverageConfidence();
    console.log('Average confidence:', Math.round(avgConfidence * 100) + '%');
    console.assert(avgConfidence > 0.86 && avgConfidence < 0.89, 'Average confidence should be around 87-88%');
    console.log('✅ Test 6 passed\n');
    
    console.log('🎉 All PoseStateManager tests passed!');
    
    // Reset for actual use
    poseStateManager.initializePoseState();
};

// ============================================================================
// END TEST FUNCTIONS
// ============================================================================

// Initialize application
document.addEventListener('DOMContentLoaded', function() {
    // Load asana data
    loadAsanaData();
    // Load user profile
    loadUserProfile();
    
    // Speak welcome message after a short delay (let page load first)
    setTimeout(() => {
        const currentLang = document.getElementById('languageSelect')?.value || 'en';
        speakWelcomeMessage(currentLang);
    }, 1000); // 1 second delay to ensure page is fully loaded
    
    // Application is ready
    console.log('Yoga AI Trainer initialized');
    console.log('Use testPoseMatching("pose_name") to test pose matching');
    console.log('Use testPoseStateManager() to test pose state management');
});

// ============================================================================
// BROWSER CLOSE HANDLER - Log final pose before page unload
// ============================================================================

/**
 * Handle browser close or page navigation during active session
 * This ensures the current pose is logged before the page unloads
 * Requirements: 3.4, 7.3
 */
window.addEventListener('beforeunload', async (event) => {
    // Clean up tracking loss state
    if (trackingLossTimeout) {
        clearTimeout(trackingLossTimeout);
        trackingLossTimeout = null;
    }
    trackingLossDetected = false;
    trackingLossStartTime = null;
    
    // Only attempt to log if session is active and user is holding a pose
    if (sessionActive && poseStateManager.currentAsana) {
        const duration = poseStateManager.getDuration();
        
        console.log(`⚠️ Page unloading - session active with pose: ${poseStateManager.currentAsana} (${duration}s)`);
        
        // Log the current pose before exit
        await logCurrentPoseBeforeExit();
        
        // Note: We don't show a confirmation dialog as it would interrupt the user
        // The beacon API will handle sending the data reliably
    }
});

// ============================================================================
// END BROWSER CLOSE HANDLER
// ============================================================================