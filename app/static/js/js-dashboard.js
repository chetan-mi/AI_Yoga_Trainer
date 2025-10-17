
// Load leaderboard when page loads
document.addEventListener('DOMContentLoaded', function() {
    loadLeaderboard();
});

// Load global leaderboard from API
async function loadLeaderboard() {
    try {
        console.log('Loading leaderboard...');
        const response = await fetch('/api/leaderboard');
        
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const leaderboard = await response.json();
        console.log('Leaderboard data:', leaderboard);
        
        const leaderboardList = document.getElementById('leaderboard-list');
        
        if (!leaderboard || leaderboard.length === 0) {
            leaderboardList.innerHTML = '<div class="no-data">No users found. Start practicing to appear on the leaderboard!</div>';
            return;
        }
        
        // Check if it's an error response
        if (leaderboard.error) {
            throw new Error(leaderboard.error);
        }
        
        leaderboardList.innerHTML = leaderboard.map((user, index) => {
            const rank = index + 1;
            const isCurrentUser = user.is_current_user;
            const rankClass = getRankClass(rank);
            const userLevel = calculateUserLevel(user.total_asanas);
            
            return `
                <div class="leaderboard-item ${isCurrentUser ? 'current-user' : ''}">
                    <div class="rank-badge ${rankClass}">
                        ${rank <= 3 ? getRankEmoji(rank) : rank}
                    </div>
                    <div class="user-info">
                        <div class="user-name">
                            ${user.username}${isCurrentUser ? ' (You)' : ''}
                        </div>
                        <div class="user-level">${userLevel}</div>
                    </div>
                    <div class="user-score">
                        ${user.total_asanas}
                        <span class="score-label">asanas</span>
                    </div>
                </div>
            `;
        }).join('');
    } catch (error) {
        console.error('Error loading leaderboard:', error);
        const leaderboardList = document.getElementById('leaderboard-list');
        leaderboardList.innerHTML = `<div class="no-data">Error loading leaderboard: ${error.message}</div>`;
    }
}

// Helper functions for leaderboard
function getRankClass(rank) {
    if (rank === 1) return 'gold';
    if (rank === 2) return 'silver';
    if (rank === 3) return 'bronze';
    return '';
}

function getRankEmoji(rank) {
    const emojis = { 1: '🥇', 2: '🥈', 3: '🥉' };
    return emojis[rank] || rank;
}

function calculateUserLevel(totalAsanas) {
    if (totalAsanas >= 500) return "Yoga Master 🏆";
    if (totalAsanas >= 250) return "Advanced Yogi 🌟";
    if (totalAsanas >= 100) return "Intermediate Yogi 💫";
    if (totalAsanas >= 50) return "Beginner Yogi 🌱";
    return "New Yogi 🎯";
}

// Create sample session
async function createSampleSession() {
    try {
        const response = await fetch('/api/session/create', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                type: 'learning',
                progress: Math.floor(Math.random() * 100),
                current_module: 'Module ' + (Math.floor(Math.random() * 5) + 1),
                score: Math.floor(Math.random() * 50) + 50
            })
        });
        
        const result = await response.json();
        if (result.status === 'created') {
            alert('Sample session created successfully!');
            loadProgress(); // Refresh the progress list
        }
    } catch (error) {
        console.error('Error creating session:', error);
        alert('Error creating session');
    }
}

// View progress in console
function viewProgress() {
    console.log('View progress clicked');
    loadProgress();
}

// Load user statistics
async function loadUserStats() {
    try {
        const response = await fetch('/api/user/stats?days=30');
        const stats = await response.json();
        
        // Update basic stats
        document.getElementById('totalAsanas').textContent = stats.total_asanas;
        document.getElementById('uniqueAsanas').textContent = stats.unique_asanas;
        document.getElementById('currentStreak').textContent = stats.current_streak;
        document.getElementById('userLevel').textContent = stats.user_level;
        
        // Update daily activity
        updateDailyActivity(stats.daily_activity);
        
        // Update top asanas
        updateTopAsanas(stats.top_asanas);
        
    } catch (error) {
        console.error('Error loading user stats:', error);
    }
}

function updateDailyActivity(dailyData) {
    const container = document.getElementById('dailyActivity');
    if (!container) return;
    
    container.innerHTML = '';
    
    // Find the maximum count to scale bars properly
    const maxCount = Math.max(...dailyData.map(d => d.count), 1);
    const maxBarHeight = 100; // Maximum height in pixels
    
    dailyData.forEach(day => {
        const dayElement = document.createElement('div');
        dayElement.className = 'day-activity';
        
        // Scale bar height: if count is 0, show 5px; otherwise scale proportionally
        const barHeight = day.count === 0 ? 5 : Math.max((day.count / maxCount) * maxBarHeight, 10);
        
        dayElement.innerHTML = `
            <div class="day-name">${day.day_name}</div>
            <div class="day-bar" style="height: ${barHeight}px"></div>
            <div class="day-count">${day.count}</div>
        `;
        container.appendChild(dayElement);
    });
}

function updateTopAsanas(topAsanas) {
    const container = document.getElementById('topAsanasList');
    container.innerHTML = '';
    
    if (topAsanas.length === 0) {
        container.innerHTML = '<p class="no-data">Start practicing to see your top asanas!</p>';
        return;
    }
    
    topAsanas.forEach((asana, index) => {
        const asanaElement = document.createElement('div');
        asanaElement.className = 'asana-item';
        asanaElement.innerHTML = `
            <span class="asana-rank">${index + 1}</span>
            <span class="asana-name">${asana.traditional_name || asana._id}</span>
            <span class="asana-count">${asana.count} times</span>
        `;
        container.appendChild(asanaElement);
    });
}

// Load stats when page loads
document.addEventListener('DOMContentLoaded', function() {
    loadUserStats();
    
    // Refresh stats every 30 seconds if needed
    setInterval(loadUserStats, 30000);
});

function refreshStats() {
    console.log('Refreshing yoga statistics...');
    loadUserStats();
}

// ==================== USER STATISTICS ====================

async function loadUserStats() {
    try {
        const response = await fetch('/api/user/stats?days=30');
        const stats = await response.json();
        
        // Update basic stats
        updateBasicStats(stats);
        
        // Update daily activity
        updateDailyActivity(stats.daily_activity);
        
        // Update top asanas
        updateTopAsanas(stats.top_asanas);
        
    } catch (error) {
        console.error('Error loading user stats:', error);
    }
}

function updateBasicStats(stats) {
    const totalElement = document.getElementById('totalAsanas');
    const uniqueElement = document.getElementById('uniqueAsanas');
    const streakElement = document.getElementById('currentStreak');
    const levelElement = document.getElementById('userLevel');
    
    if (totalElement) totalElement.textContent = stats.total_asanas || 0;
    if (uniqueElement) uniqueElement.textContent = stats.unique_asanas || 0;
    if (streakElement) streakElement.textContent = stats.current_streak || 0;
    if (levelElement) levelElement.textContent = stats.user_level || 'New Yogi 🎯';
}

function updateDailyActivity(dailyData) {
    const container = document.getElementById('dailyActivity');
    if (!container) return;
    
    container.innerHTML = '';
    
    // Find the maximum count to scale bars properly
    const maxCount = Math.max(...dailyData.map(d => d.count), 1);
    const maxBarHeight = 100; // Maximum height in pixels
    
    dailyData.forEach(day => {
        const dayElement = document.createElement('div');
        dayElement.className = 'day-activity';
        
        // Scale bar height: if count is 0, show 5px; otherwise scale proportionally
        const barHeight = day.count === 0 ? 5 : Math.max((day.count / maxCount) * maxBarHeight, 10);
        
        dayElement.innerHTML = `
            <div class="day-name">${day.day_name}</div>
            <div class="day-bar" style="height: ${barHeight}px"></div>
            <div class="day-count">${day.count}</div>
        `;
        container.appendChild(dayElement);
    });
}

function updateTopAsanas(topAsanas) {
    const container = document.getElementById('topAsanasList');
    if (!container) return;
    
    container.innerHTML = '';
    topAsanas.forEach((asana, index) => {
        const asanaElement = document.createElement('div');
        asanaElement.className = 'asana-item';
        asanaElement.innerHTML = `
            <span class="asana-rank">${index + 1}</span>
            <span class="asana-name">${asana.traditional_name || asana._id}</span>
            <span class="asana-count">${asana.count} times</span>
        `;
        container.appendChild(asanaElement);
    });
}

function refreshStats() {
    loadUserStats();
}

// Load stats and leaderboard when page loads
document.addEventListener('DOMContentLoaded', function() {
    setTimeout(loadUserStats, 1000);
    setTimeout(loadLeaderboard, 1500);
    
    // Note: Auto-refresh removed to save resources - use manual refresh button instead
});

// Enhanced refresh function with loading state
async function refreshLeaderboard(button) {
    // Add loading state
    button.classList.add('loading');
    button.disabled = true;
    
    const originalText = button.innerHTML;
    button.innerHTML = '<span class="refresh-icon">🔄</span><span>Refreshing...</span>';
    
    try {
        await loadLeaderboard();
        
        // Success feedback
        button.innerHTML = '<span class="refresh-icon">✅</span><span>Updated!</span>';
        
        // Reset after 1 second
        setTimeout(() => {
            button.innerHTML = originalText;
            button.classList.remove('loading');
            button.disabled = false;
        }, 1000);
        
    } catch (error) {
        console.error('Error refreshing leaderboard:', error);
        
        // Error feedback
        button.innerHTML = '<span class="refresh-icon">❌</span><span>Error</span>';
        
        // Reset after 2 seconds
        setTimeout(() => {
            button.innerHTML = originalText;
            button.classList.remove('loading');
            button.disabled = false;
        }, 2000);
    }
}
