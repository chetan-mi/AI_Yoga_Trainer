// Sample asana data - you can expand this with your full dataset
const asanas = [
  {
    id: "vrksasana",
    englishName: "Tree Pose",
    sanskritName: "Vrksasana",
    difficulty: "beginner",
    category: "balancing",
    imageUrl: "/static/uploads/Tree_Pose_or_Vrksasana_.jpg",
    benefits: [
      "Improves balance and stability",
      "Strengthens legs, ankles, and core",
      "Increases focus and concentration",
      "Stretches hips, thighs, and shoulders",
      "Promotes calmness and mental clarity",
    ],
    risks: [
      "Avoid with knee or ankle injuries",
      "Those with low blood pressure should be cautious",
      "Use wall support if balance is challenging",
      "Do not lock the standing knee",
    ],
    videoUrl:
      "https://www.youtube.com/results?search_query=vrksasana+tree+pose",
  },
  {
    id: "adho_mukha_svanasana",
    englishName: "Downward-Facing Dog",
    sanskritName: "Adho Mukha Svanasana",
    difficulty: "beginner",
    category: "inversion",
    imageUrl:
      "/static/uploads/Downward-Facing_Dog_pose_or_Adho_Mukha_Svanasana_.jpg",
    benefits: [
      "Strengthens arms, shoulders, and legs",
      "Stretches spine, hamstrings, and calves",
      "Improves circulation and energizes body",
      "Calms the mind and relieves stress",
      "Helps with digestion",
    ],
    risks: [
      "Avoid with wrist or shoulder injuries",
      "Those with high blood pressure should be cautious",
      "Pregnant women should modify",
      "Not recommended for carpal tunnel",
    ],
    videoUrl: "https://www.youtube.com/results?search_query=downward+dog",
  },
  {
    id: "virabhadrasana_1",
    englishName: "Warrior I",
    sanskritName: "Virabhadrasana I",
    difficulty: "beginner",
    category: "standing",
    imageUrl: "/static/uploads/Warrior_I_Pose_or_Virabhadrasana_I_.jpg",
    benefits: [
      "Strengthens legs, glutes, and core",
      "Opens chest and shoulders",
      "Improves focus and stability",
      "Stretches hip flexors and thighs",
      "Builds stamina and endurance",
    ],
    risks: [
      "Be cautious with knee injuries",
      "Avoid if you have high blood pressure",
      "Those with shoulder issues should modify arms",
      "Do not force back heel down",
    ],
    videoUrl: "https://www.youtube.com/results?search_query=warrior+1+pose",
  },
  {
    id: "akarna_dhanurasana",
    englishName: "Shooting Bow Pose",
    sanskritName: "Akarna Dhanurasana",
    difficulty: "advanced",
    category: "seated",
    imageUrl: "/static/uploads/Akarna_Dhanurasana.png",
    benefits: [
      "Strengthens core and hip flexors",
      "Improves flexibility in legs and hips",
      "Enhances balance and coordination",
      "Stimulates abdominal organs",
      "Builds focus and concentration",
    ],
    risks: [
      "Avoid with hamstring or hip injuries",
      "Not recommended for lower back problems",
      "Use caution with knee issues",
      "Requires good flexibility to perform safely",
    ],
    videoUrl: "https://www.youtube.com/results?search_query=akarna+dhanurasana",
  },
  {
    id: "bharadvajasana_1",
    englishName: "Bharadvaja's Twist",
    sanskritName: "Bharadvajasana I",
    difficulty: "beginner",
    category: "seated",
    imageUrl:
      "/static/uploads/Bharadvajas_Twist_pose_or_Bharadvajasana_I_.jpeg",
    benefits: [
      "Stretches spine, shoulders, and hips",
      "Stimulates abdominal organs and aids digestion",
      "Relieves lower back pain",
      "Improves spinal mobility",
      "Calms the nervous system",
    ],
    risks: [
      "Avoid if you have severe spinal injuries",
      "Be cautious with knee problems",
      "Those with chronic back conditions should modify",
      "Do not force the twist",
    ],
    videoUrl: "https://www.youtube.com/results?search_query=bharadvajasana",
  },
  {
    id: "paripurna_navasana",
    englishName: "Boat Pose",
    sanskritName: "Paripurna Navasana",
    difficulty: "intermediate",
    category: "balancing",
    imageUrl: "/static/uploads/Boat_Pose_or_Paripurna_Navasana_.png",
    benefits: [
      "Strengthens core, hip flexors, and spine",
      "Improves balance and digestion",
      "Stimulates kidneys and thyroid",
      "Relieves stress and builds confidence",
      "Tones abdominal muscles",
    ],
    risks: [
      "Avoid with neck or lower back injuries",
      "Not recommended during pregnancy",
      "Those with hernias should skip this pose",
      "Be cautious if you have hip problems",
    ],
    videoUrl: "https://www.youtube.com/results?search_query=boat+pose+navasana",
  },
  {
    id: "baddha_konasana",
    englishName: "Bound Angle Pose",
    sanskritName: "Baddha Konasana",
    difficulty: "beginner",
    category: "seated",
    imageUrl: "/static/uploads/Bound_Angle_Pose_or_Baddha_Konasana_.jpg",
    benefits: [
      "Opens hips and groin",
      "Stretches inner thighs and knees",
      "Stimulates abdominal organs and ovaries",
      "Relieves menstrual discomfort",
      "Calms the mind and reduces anxiety",
    ],
    risks: [
      "Use props if you have knee injuries",
      "Avoid if you have groin or knee injuries",
      "Those with lower back issues should sit on blankets",
      "Do not force knees down",
    ],
    videoUrl: "https://www.youtube.com/results?search_query=baddha+konasana",
  },
  {
    id: "dhanurasana",
    englishName: "Bow Pose",
    sanskritName: "Dhanurasana",
    difficulty: "intermediate",
    category: "backbend",
    imageUrl: "/static/uploads/Bow_Pose_or_Dhanurasana_.jpg",
    benefits: [
      "Stretches entire front of body",
      "Strengthens back muscles",
      "Improves posture and spinal flexibility",
      "Stimulates digestive organs",
      "Opens chest and shoulders",
    ],
    risks: [
      "Avoid with back, neck, or shoulder injuries",
      "Not recommended for high or low blood pressure",
      "Skip if pregnant",
      "Those with migraines should avoid",
    ],
    videoUrl:
      "https://www.youtube.com/results?search_query=dhanurasana+bow+pose",
  },
  {
    id: "setu_bandha_sarvangasana",
    englishName: "Bridge Pose",
    sanskritName: "Setu Bandha Sarvangasana",
    difficulty: "beginner",
    category: "backbend",
    imageUrl: "/static/uploads/Bridge_Pose_or_Setu_Bandha_Sarvangasana_.png",
    benefits: [
      "Stretches chest, neck, and spine",
      "Strengthens back, glutes, and legs",
      "Calms the brain and reduces anxiety",
      "Stimulates thyroid and improves digestion",
      "Relieves back pain and headaches",
    ],
    risks: [
      "Avoid with neck injuries",
      "Be cautious if you have knee problems",
      "Those with back injuries should use props",
      "Do not turn head while in pose",
    ],
    videoUrl:
      "https://www.youtube.com/results?search_query=bridge+pose+setu+bandha",
  },
  {
    id: "ustrasana",
    englishName: "Camel Pose",
    sanskritName: "Ustrasana",
    difficulty: "intermediate",
    category: "backbend",
    imageUrl: "/static/uploads/Camel_Pose_or_Ustrasana_.jpg",
    benefits: [
      "Opens chest and shoulders deeply",
      "Stretches hip flexors and thighs",
      "Improves spinal flexibility",
      "Stimulates thyroid and abdominal organs",
      "Strengthens back muscles",
    ],
    risks: [
      "Avoid with serious back or neck injuries",
      "Not recommended for high or low blood pressure",
      "Those with migraines should skip",
      "Come out slowly to avoid dizziness",
    ],
    videoUrl:
      "https://www.youtube.com/results?search_query=ustrasana+camel+pose",
  },
  {
    id: "marjaryasana",
    englishName: "Cat-Cow Pose",
    sanskritName: "Marjaryasana",
    difficulty: "beginner",
    category: "seated",
    imageUrl: "/static/uploads/Cat_Cow_Pose_or_Marjaryasana_.jpg",
    benefits: [
      "Increases spinal flexibility",
      "Stretches back, neck, and torso",
      "Massages organs and improves circulation",
      "Relieves back pain and stress",
      "Coordinates breath with movement",
    ],
    risks: [
      "Be careful with wrist injuries",
      "Those with neck problems should keep head neutral",
      "Avoid if you have severe back injuries",
      "Move gently if you have knee issues",
    ],
    videoUrl: "https://www.youtube.com/results?search_query=cat+cow+pose",
  },
  {
    id: "utkatasana",
    englishName: "Chair Pose",
    sanskritName: "Utkatasana",
    difficulty: "beginner",
    category: "standing",
    imageUrl: "/static/uploads/Chair_Pose_or_Utkatasana_.jpg",
    benefits: [
      "Strengthens thighs, calves, and ankles",
      "Stretches shoulders and chest",
      "Stimulates heart and diaphragm",
      "Builds stamina and determination",
      "Tones abdominal organs",
    ],
    risks: [
      "Avoid with knee injuries",
      "Be cautious if you have ankle problems",
      "Those with chronic headaches should skip",
      "Modify if you have low blood pressure",
    ],
    videoUrl:
      "https://www.youtube.com/results?search_query=utkatasana+chair+pose",
  },
  {
    id: "balasana",
    englishName: "Child Pose",
    sanskritName: "Balasana",
    difficulty: "beginner",
    category: "seated",
    imageUrl: "/static/uploads/Child_Pose_or_Balasana_.webp",
    benefits: [
      "Gently stretches hips, thighs, and ankles",
      "Calms the brain and relieves stress",
      "Relieves back and neck pain",
      "Promotes relaxation and mental calm",
      "Helps with digestion",
    ],
    risks: [
      "Avoid if pregnant",
      "Those with knee injuries should use props",
      "Not recommended with diarrhea",
      "Use caution with high blood pressure",
    ],
    videoUrl:
      "https://www.youtube.com/results?search_query=balasana+child+pose",
  },
  {
    id: "bhujangasana",
    englishName: "Cobra Pose",
    sanskritName: "Bhujangasana",
    difficulty: "beginner",
    category: "backbend",
    imageUrl: "/static/uploads/Cobra_Pose_or_Bhujangasana_.jpg",
    benefits: [
      "Strengthens spine and opens chest",
      "Stretches shoulders, chest, and abdomen",
      "Firms the buttocks",
      "Stimulates abdominal organs",
      "Helps relieve stress and fatigue",
    ],
    risks: [
      "Avoid with back injuries",
      "Not recommended during pregnancy",
      "Those with carpal tunnel should be cautious",
      "Do not overextend the back",
    ],
    videoUrl: "https://www.youtube.com/results?search_query=bhujangasana+cobra",
  },
  {
    id: "kukkutasana",
    englishName: "Cockerel Pose",
    sanskritName: "Kukkutasana",
    difficulty: "advanced",
    category: "balancing",
    imageUrl: "/static/uploads/Cockerel_Pose.jpg",
    benefits: [
      "Strengthens arms, wrists, and shoulders",
      "Improves balance and concentration",
      "Tones abdominal muscles",
      "Enhances core strength",
      "Builds upper body endurance",
    ],
    risks: [
      "Not for beginners",
      "Avoid with wrist or shoulder injuries",
      "Those with elbow problems should skip",
      "Requires good flexibility in hips and legs",
    ],
    videoUrl: "https://www.youtube.com/results?search_query=kukkutasana",
  },
  {
    id: "savasana",
    englishName: "Corpse Pose",
    sanskritName: "Savasana",
    difficulty: "beginner",
    category: "seated",
    imageUrl: "/static/uploads/Corpse_Pose_or_Savasana_.jpeg",
    benefits: [
      "Promotes deep relaxation",
      "Reduces stress and anxiety",
      "Lowers blood pressure",
      "Calms nervous system",
      "Integrates benefits of practice",
    ],
    risks: [
      "Some may find it challenging to relax",
      "Those with back pain should use props",
      "May trigger anxiety in some practitioners",
      "Keep warm to avoid getting cold",
    ],
    videoUrl:
      "https://www.youtube.com/results?search_query=savasana+corpse+pose",
  },
  {
    id: "gomukhasana",
    englishName: "Cow Face Pose",
    sanskritName: "Gomukhasana",
    difficulty: "intermediate",
    category: "seated",
    imageUrl: "/static/uploads/Cow_Face_Pose_or_Gomukhasana_.jpg",
    benefits: [
      "Stretches ankles, hips, thighs, and shoulders",
      "Opens chest and improves posture",
      "Relieves chronic knee pain",
      "Strengthens back muscles",
      "Helps with respiratory issues",
    ],
    risks: [
      "Avoid with serious neck or shoulder injuries",
      "Those with knee problems should modify",
      "Use strap if shoulders are tight",
      "Be gentle with hip injuries",
    ],
    videoUrl: "https://www.youtube.com/results?search_query=gomukhasana",
  },
  {
    id: "bakasana",
    englishName: "Crane (Crow) Pose",
    sanskritName: "Bakasana",
    difficulty: "advanced",
    category: "balancing",
    imageUrl: "/static/uploads/Crane_(Crow)Pose_or_Bakasana.avif",
    benefits: [
      "Strengthens arms and wrists",
      "Tones abdominal muscles",
      "Improves balance and coordination",
      "Builds mental focus and confidence",
      "Stretches upper back",
    ],
    risks: [
      "Not for beginners without supervision",
      "Avoid with wrist or shoulder injuries",
      "Those with carpal tunnel should skip",
      "Use padding under hands if needed",
    ],
    videoUrl: "https://www.youtube.com/results?search_query=bakasana+crow+pose",
  },
  {
    id: "makara_adho_mukha_svanasana",
    englishName: "Dolphin Plank Pose",
    sanskritName: "Makara Adho Mukha Svanasana",
    difficulty: "intermediate",
    category: "balancing",
    imageUrl:
      "/static/uploads/Dolphin_Plank_Pose_or_Makara_Adho_Mukha_Svanasana_.png",
    benefits: [
      "Strengthens core, arms, and legs",
      "Builds endurance and stability",
      "Improves posture",
      "Tones abdominal muscles",
      "Prepares for inversions",
    ],
    risks: [
      "Avoid with shoulder or neck injuries",
      "Not recommended for carpal tunnel",
      "Those with high blood pressure should modify",
      "Do not let hips sag",
    ],
    videoUrl: "https://www.youtube.com/results?search_query=dolphin+plank+pose",
  },
  {
    id: "ardha_pincha_mayurasana",
    englishName: "Dolphin Pose",
    sanskritName: "Ardha Pincha Mayurasana",
    difficulty: "intermediate",
    category: "inversion",
    imageUrl: "/static/uploads/Dolphin_Pose_or_Ardha_Pincha_Mayurasana_.webp",
    benefits: [
      "Strengthens arms, legs, and shoulders",
      "Stretches shoulders, hamstrings, and calves",
      "Improves balance and concentration",
      "Calms the mind",
      "Prepares for headstand and forearm balance",
    ],
    risks: [
      "Avoid with neck or shoulder injuries",
      "Not recommended for high blood pressure",
      "Those with headaches should skip",
      "Be careful with tight hamstrings",
    ],
    videoUrl: "https://www.youtube.com/results?search_query=dolphin+pose",
  },
  {
    id: "garudasana",
    englishName: "Eagle Pose",
    sanskritName: "Garudasana",
    difficulty: "intermediate",
    category: "balancing",
    imageUrl: "/static/uploads/Eagle_Pose_or_Garudasana_.jpg",
    benefits: [
      "Improves balance and focus",
      "Stretches shoulders, upper back, and thighs",
      "Strengthens legs and ankles",
      "Improves concentration",
      "Opens shoulder joints",
    ],
    risks: [
      "Avoid with knee, ankle, or elbow injuries",
      "Those with low blood pressure should be cautious",
      "May be challenging for those with balance issues",
      "Do not force the bind",
    ],
    videoUrl:
      "https://www.youtube.com/results?search_query=garudasana+eagle+pose",
  },
  {
    id: "astavakrasana",
    englishName: "Eight-Angle Pose",
    sanskritName: "Astavakrasana",
    difficulty: "advanced",
    category: "balancing",
    imageUrl: "/static/uploads/Eight-Angle_Pose_or_Astavakrasana_.jpg",
    benefits: [
      "Strengthens arms, wrists, and core",
      "Improves balance and body awareness",
      "Builds confidence and mental focus",
      "Tones abdominal organs",
      "Develops upper body strength",
    ],
    risks: [
      "Not for beginners",
      "Avoid with wrist, elbow, or shoulder injuries",
      "Those with lower back issues should skip",
      "Requires strong core and arm strength",
    ],
    videoUrl: "https://www.youtube.com/results?search_query=astavakrasana",
  },
];

// Add more asanas to complete the collection
asanas.push(
  {
    id: "uttana_shishosana",
    englishName: "Extended Puppy Pose",
    sanskritName: "Uttana Shishosana",
    difficulty: "beginner",
    category: "seated",
    imageUrl: "/static/uploads/Extended_Puppy_Pose_or_Uttana_Shishosana_.jpeg",
    benefits: [
      "Stretches spine and shoulders",
      "Relieves tension in back and neck",
      "Calms the mind",
      "Opens chest and improves breathing",
      "Gentle backbend for beginners",
    ],
    risks: [
      "Avoid with serious knee or hip injuries",
      "Those with shoulder problems should modify",
      "Be cautious if you have neck issues",
      "Use padding under knees if needed",
    ],
    videoUrl:
      "https://www.youtube.com/results?search_query=extended+puppy+pose",
  },
  {
    id: "utthita_parsvakonasana",
    englishName: "Extended Side Angle Pose",
    sanskritName: "Utthita Parsvakonasana",
    difficulty: "intermediate",
    category: "standing",
    imageUrl:
      "/static/uploads/Extended_Revolved_Side_Angle_Pose_or_Utthita_Parsvakonasana_.jpg",
    benefits: [
      "Strengthens legs, knees, and ankles",
      "Stretches groins, spine, and chest",
      "Stimulates abdominal organs",
      "Improves stamina",
      "Opens hips and chest",
    ],
    risks: [
      "Avoid with low blood pressure",
      "Those with neck problems should not look up",
      "Be cautious with headaches",
      "Keep front knee over ankle",
    ],
    videoUrl:
      "https://www.youtube.com/results?search_query=extended+side+angle",
  },
  {
    id: "utthita_trikonasana",
    englishName: "Triangle Pose",
    sanskritName: "Utthita Trikonasana",
    difficulty: "beginner",
    category: "standing",
    imageUrl:
      "/static/uploads/Extended_Revolved_Triangle_Pose_or_Utthita_Trikonasana_.jpg",
    benefits: [
      "Stretches legs, hips, and spine",
      "Opens chest and shoulders",
      "Stimulates abdominal organs",
      "Improves digestion",
      "Relieves stress",
    ],
    risks: [
      "Avoid with low blood pressure",
      "Those with neck issues should not look up",
      "Be cautious with back problems",
      "Do not overextend with diarrhea",
    ],
    videoUrl: "https://www.youtube.com/results?search_query=triangle+pose",
  },
  {
    id: "pincha_mayurasana",
    englishName: "Feathered Peacock Pose",
    sanskritName: "Pincha Mayurasana",
    difficulty: "advanced",
    category: "inversion",
    imageUrl:
      "/static/uploads/Feathered_Peacock_Pose_or_Pincha_Mayurasana_.jpeg",
    benefits: [
      "Strengthens shoulders, arms, and back",
      "Improves balance and concentration",
      "Calms the brain",
      "Stretches chest and shoulders",
      "Builds confidence",
    ],
    risks: [
      "Not for beginners",
      "Avoid with back, shoulder, or neck injuries",
      "Not recommended for high blood pressure",
      "Avoid during menstruation",
      "Practice near wall for safety",
    ],
    videoUrl: "https://www.youtube.com/results?search_query=pincha+mayurasana",
  },
  {
    id: "tittibhasana",
    englishName: "Firefly Pose",
    sanskritName: "Tittibhasana",
    difficulty: "advanced",
    category: "balancing",
    imageUrl: "/static/uploads/Firefly_Pose_or_Tittibhasana_.png",
    benefits: [
      "Strengthens arms and wrists",
      "Tones abdominal muscles",
      "Stretches groin and back torso",
      "Improves balance and focus",
      "Opens hamstrings and inner thighs",
    ],
    risks: [
      "Not for beginners",
      "Avoid with wrist, elbow, or shoulder injuries",
      "Those with lower back problems should skip",
      "Requires significant flexibility and strength",
    ],
    videoUrl:
      "https://www.youtube.com/results?search_query=tittibhasana+firefly",
  },
  {
    id: "matsyasana",
    englishName: "Fish Pose",
    sanskritName: "Matsyasana",
    difficulty: "beginner",
    category: "backbend",
    imageUrl: "/static/uploads/Fish_Pose_or_Matsyasana_.webp",
    benefits: [
      "Stretches chest, throat, and abdomen",
      "Strengthens upper back and neck",
      "Improves posture",
      "Stimulates thyroid",
      "Relieves tension in neck and shoulders",
    ],
    risks: [
      "Avoid with serious neck or lower back injuries",
      "Not recommended for high or low blood pressure",
      "Those with migraines should skip",
      "Come out slowly",
    ],
    videoUrl:
      "https://www.youtube.com/results?search_query=matsyasana+fish+pose",
  },
  {
    id: "chaturanga_dandasana",
    englishName: "Four-Limbed Staff Pose",
    sanskritName: "Chaturanga Dandasana",
    difficulty: "intermediate",
    category: "balancing",
    imageUrl:
      "/static/uploads/Four-Limbed_Staff_Pose_or_Chaturanga_Dandasana_.jpg",
    benefits: [
      "Strengthens arms, wrists, and abdomen",
      "Tones the body",
      "Builds core strength",
      "Prepares for arm balances",
      "Improves posture",
    ],
    risks: [
      "Avoid with wrist or shoulder injuries",
      "Not recommended for carpal tunnel",
      "Those with lower back issues should modify",
      "Keep elbows close to body",
    ],
    videoUrl:
      "https://www.youtube.com/results?search_query=chaturanga+dandasana",
  },
  {
    id: "bhekasana",
    englishName: "Frog Pose",
    sanskritName: "Bhekasana",
    difficulty: "intermediate",
    category: "backbend",
    imageUrl: "/static/uploads/Frog_Pose_or_Bhekasana.webp",
    benefits: [
      "Stretches quadriceps and hip flexors",
      "Opens chest and shoulders",
      "Improves posture",
      "Stimulates abdominal organs",
      "Strengthens back muscles",
    ],
    risks: [
      "Avoid with knee or ankle injuries",
      "Not recommended for high or low blood pressure",
      "Those with neck injuries should be cautious",
      "Do not force the knee bend",
    ],
    videoUrl:
      "https://www.youtube.com/results?search_query=bhekasana+frog+pose",
  },
  {
    id: "malasana",
    englishName: "Garland Pose",
    sanskritName: "Malasana",
    difficulty: "beginner",
    category: "standing",
    imageUrl: "/static/uploads/Garland_Pose_or_Malasana_.jpeg",
    benefits: [
      "Stretches ankles, groin, and back torso",
      "Tones the belly",
      "Aids digestion",
      "Opens hips deeply",
      "Improves balance and focus",
    ],
    risks: [
      "Avoid with knee injuries",
      "Those with lower back problems should use props",
      "Be cautious with ankle issues",
      "Use block under hips if needed",
    ],
    videoUrl:
      "https://www.youtube.com/results?search_query=malasana+garland+pose",
  },
  {
    id: "parighasana",
    englishName: "Gate Pose",
    sanskritName: "Parighasana",
    difficulty: "beginner",
    category: "standing",
    imageUrl: "/static/uploads/Gate_Pose_or_Parighasana_.jpeg",
    benefits: [
      "Stretches sides of torso and spine",
      "Opens shoulders and chest",
      "Stimulates abdominal organs",
      "Stretches hamstrings",
      "Improves breathing capacity",
    ],
    risks: [
      "Avoid with serious knee injuries",
      "Those with hip problems should modify",
      "Be gentle if you have lower back issues",
      "Use padding under knee",
    ],
    videoUrl:
      "https://www.youtube.com/results?search_query=parighasana+gate+pose",
  },
  {
    id: "ardha_matsyendrasana",
    englishName: "Half Lord of the Fishes Pose",
    sanskritName: "Ardha Matsyendrasana",
    difficulty: "intermediate",
    category: "seated",
    imageUrl:
      "/static/uploads/Half_Lord_of_the_Fishes_Pose_or_Ardha_Matsyendrasana_.jpeg",
    benefits: [
      "Stretches shoulders, hips, and neck",
      "Stimulates digestive fire",
      "Relieves menstrual discomfort",
      "Improves spinal flexibility",
      "Energizes the spine",
    ],
    risks: [
      "Avoid with back or spine injuries",
      "Those with herniated discs should skip",
      "Be cautious if pregnant",
      "Do not force the twist",
    ],
    videoUrl:
      "https://www.youtube.com/results?search_query=ardha+matsyendrasana",
  },
  {
    id: "ardha_chandrasana",
    englishName: "Half Moon Pose",
    sanskritName: "Ardha Chandrasana",
    difficulty: "intermediate",
    category: "balancing",
    imageUrl: "/static/uploads/Half_Moon_Pose_or_Ardha_Chandrasana_.jpg",
    benefits: [
      "Improves balance and coordination",
      "Strengthens ankles, legs, and spine",
      "Stretches groins, hamstrings, and calves",
      "Opens chest and shoulders",
      "Relieves stress",
    ],
    risks: [
      "Avoid with low blood pressure",
      "Those with neck problems should not look up",
      "Use wall for support if needed",
      "Be cautious with headaches or migraines",
    ],
    videoUrl: "https://www.youtube.com/results?search_query=half+moon+pose",
  },
  {
    id: "adho_mukha_vrksasana",
    englishName: "Handstand",
    sanskritName: "Adho Mukha Vrksasana",
    difficulty: "advanced",
    category: "inversion",
    imageUrl: "/static/uploads/Handstand_pose_or_Adho_Mukha_Vrksasana_.jpg",
    benefits: [
      "Strengthens shoulders, arms, and wrists",
      "Improves balance and concentration",
      "Calms the brain",
      "Builds confidence",
      "Relieves stress",
    ],
    risks: [
      "Not for beginners",
      "Avoid with back, shoulder, or neck injuries",
      "Not recommended for high blood pressure",
      "Avoid during menstruation and pregnancy",
      "Practice with spotter or wall",
    ],
    videoUrl: "https://www.youtube.com/results?search_query=handstand",
  },
  {
    id: "ananda_balasana",
    englishName: "Happy Baby Pose",
    sanskritName: "Ananda Balasana",
    difficulty: "beginner",
    category: "seated",
    imageUrl: "/static/uploads/Happy_Baby_Pose_or_Ananda_Balasana_.jpg",
    benefits: [
      "Stretches inner groin and back spine",
      "Calms the brain and relieves stress",
      "Releases lower back tension",
      "Stretches hamstrings",
      "Opens hips and chest",
    ],
    risks: [
      "Avoid if pregnant",
      "Those with knee injuries should be cautious",
      "Not recommended with neck injuries",
      "Be gentle if you have hip problems",
    ],
    videoUrl: "https://www.youtube.com/results?search_query=happy+baby+pose",
  },
  {
    id: "janu_sirsasana",
    englishName: "Head-to-Knee Forward Bend",
    sanskritName: "Janu Sirsasana",
    difficulty: "beginner",
    category: "seated",
    imageUrl:
      "/static/uploads/Head-to-Knee_Forward_Bend_pose_or_Janu_Sirsasana_.jpg",
    benefits: [
      "Stretches spine, shoulders, and hamstrings",
      "Stimulates liver and kidneys",
      "Calms the brain",
      "Relieves anxiety and fatigue",
      "Helps with digestion",
    ],
    risks: [
      "Avoid with asthma or diarrhea",
      "Those with knee injuries should modify",
      "Be cautious with lower back problems",
      "Use props if hamstrings are tight",
    ],
    videoUrl: "https://www.youtube.com/results?search_query=janu+sirsasana",
  },
  {
    id: "krounchasana",
    englishName: "Heron Pose",
    sanskritName: "Krounchasana",
    difficulty: "intermediate",
    category: "seated",
    imageUrl: "/static/uploads/Heron_Pose_or_Krounchasana_.jpeg",
    benefits: [
      "Stretches hamstrings and calves",
      "Strengthens knees",
      "Stimulates abdominal organs",
      "Improves posture",
      "Opens chest and shoulders",
    ],
    risks: [
      "Avoid with serious knee or ankle injuries",
      "Those with hamstring injuries should use strap",
      "Be cautious with lower back problems",
      "Do not force the leg straight",
    ],
    videoUrl: "https://www.youtube.com/results?search_query=krounchasana+heron",
  },
  {
    id: "parsvottanasana",
    englishName: "Intense Side Stretch Pose",
    sanskritName: "Parsvottanasana",
    difficulty: "intermediate",
    category: "standing",
    imageUrl:
      "/static/uploads/Intense_Side_Stretch_Pose_or_Parsvottanasana_.jpg",
    benefits: [
      "Stretches spine, shoulders, and hips",
      "Strengthens legs",
      "Stimulates abdominal organs",
      "Improves balance",
      "Calms the brain",
    ],
    risks: [
      "Avoid with serious back injuries",
      "Those with hamstring injuries should modify",
      "Be cautious with high blood pressure",
      "Use blocks if you cannot reach floor",
    ],
    videoUrl: "https://www.youtube.com/results?search_query=parsvottanasana",
  },
  {
    id: "viparita_karani",
    englishName: "Legs-Up-the-Wall Pose",
    sanskritName: "Viparita Karani",
    difficulty: "beginner",
    category: "inversion",
    imageUrl: "/static/uploads/Legs-Up-the-Wall_Pose_or_Viparita_Karani_.jpeg",
    benefits: [
      "Relieves tired legs and feet",
      "Stretches back of legs and torso",
      "Relieves mild backache",
      "Calms the mind",
      "Reduces anxiety and stress",
    ],
    risks: [
      "Avoid during menstruation",
      "Those with glaucoma should skip",
      "Not recommended with serious eye conditions",
      "Be cautious if you have serious back or neck problems",
    ],
    videoUrl: "https://www.youtube.com/results?search_query=legs+up+wall",
  },
  {
    id: "salabhasana",
    englishName: "Locust Pose",
    sanskritName: "Salabhasana",
    difficulty: "beginner",
    category: "backbend",
    imageUrl: "/static/uploads/Locust_Pose_or_Salabhasana_.webp",
    benefits: [
      "Strengthens spine, buttocks, and back of legs",
      "Stretches shoulders, chest, and abdomen",
      "Stimulates abdominal organs",
      "Improves posture",
      "Helps relieve stress",
    ],
    risks: [
      "Avoid with serious back or neck injuries",
      "Not recommended for headaches",
      "Those with recent abdominal surgery should skip",
      "Start with gentle lifts",
    ],
    videoUrl: "https://www.youtube.com/results?search_query=salabhasana+locust",
  },
  {
    id: "natarajasana",
    englishName: "Lord of the Dance Pose",
    sanskritName: "Natarajasana",
    difficulty: "advanced",
    category: "balancing",
    imageUrl: "/static/uploads/Lord_of_the_Dance_Pose_or_Natarajasana_.png",
    benefits: [
      "Improves balance and concentration",
      "Strengthens legs and ankles",
      "Stretches shoulders, chest, and thighs",
      "Opens hip flexors",
      "Builds grace and poise",
    ],
    risks: [
      "Avoid with low blood pressure",
      "Those with ankle or knee problems should skip",
      "Be cautious with balance issues",
      "Use wall for support if needed",
    ],
    videoUrl: "https://www.youtube.com/results?search_query=natarajasana",
  }
);

// Add more advanced and popular poses
asanas.push(
  {
    id: "anjaneyasana",
    englishName: "Low Lunge",
    sanskritName: "Anjaneyasana",
    difficulty: "beginner",
    category: "standing",
    imageUrl: "/static/uploads/Low_Lunge_pose_or_Anjaneyasana_.webp",
    benefits: [
      "Stretches hip flexors and quads",
      "Opens chest and shoulders",
      "Strengthens legs",
      "Improves balance",
      "Energizes the body",
    ],
    risks: [
      "Avoid with serious knee problems",
      "Those with high blood pressure should not raise arms",
      "Use padding under back knee",
      "Be cautious with hip injuries",
    ],
    videoUrl:
      "https://www.youtube.com/results?search_query=anjaneyasana+low+lunge",
  },
  {
    id: "kumbhakasana",
    englishName: "Plank Pose",
    sanskritName: "Kumbhakasana",
    difficulty: "beginner",
    category: "balancing",
    imageUrl: "/static/uploads/Plank_Pose_or_Kumbhakasana_.jpg",
    benefits: [
      "Strengthens arms, wrists, and spine",
      "Tones the abdomen",
      "Builds core strength",
      "Improves posture",
      "Prepares for more challenging poses",
    ],
    risks: [
      "Avoid with carpal tunnel syndrome",
      "Be cautious with wrist or shoulder injuries",
      "Those with high blood pressure should modify",
      "Do not let hips sag",
    ],
    videoUrl: "https://www.youtube.com/results?search_query=plank+pose",
  },
  {
    id: "halasana",
    englishName: "Plow Pose",
    sanskritName: "Halasana",
    difficulty: "intermediate",
    category: "inversion",
    imageUrl: "/static/uploads/Plow_Pose_or_Halasana_.jpg",
    benefits: [
      "Calms the brain and nervous system",
      "Stretches shoulders and spine",
      "Stimulates thyroid and abdominal organs",
      "Reduces stress and fatigue",
      "Improves digestion",
    ],
    risks: [
      "Avoid with neck injuries",
      "Not recommended during menstruation or pregnancy",
      "Those with high blood pressure should skip",
      "Do not turn head while in pose",
    ],
    videoUrl: "https://www.youtube.com/results?search_query=halasana+plow+pose",
  },
  {
    id: "mayurasana",
    englishName: "Peacock Pose",
    sanskritName: "Mayurasana",
    difficulty: "advanced",
    category: "balancing",
    imageUrl: "/static/uploads/Peacock_Pose_or_Mayurasana_.jpg",
    benefits: [
      "Strengthens arms, wrists, and core",
      "Improves digestion and metabolism",
      "Detoxifies body",
      "Tones abdominal organs",
      "Builds mental focus",
    ],
    risks: [
      "Not for beginners",
      "Avoid with wrist, elbow, or shoulder injuries",
      "Not recommended for high blood pressure",
      "Those with hernias should skip",
      "May cause injury if done incorrectly",
    ],
    videoUrl: "https://www.youtube.com/results?search_query=mayurasana+peacock",
  },
  {
    id: "kapotasana",
    englishName: "Pigeon Pose",
    sanskritName: "Kapotasana",
    difficulty: "advanced",
    category: "backbend",
    imageUrl: "/static/uploads/Pigeon_Pose_or_Kapotasana_.jpg",
    benefits: [
      "Deep hip and chest opener",
      "Stretches entire front of body",
      "Improves spinal flexibility",
      "Stimulates abdominal organs",
      "Opens shoulders deeply",
    ],
    risks: [
      "Not for beginners",
      "Avoid with serious back, knee, or ankle injuries",
      "Not recommended for high or low blood pressure",
      "Those with neck problems should be very cautious",
      "Requires proper warm-up",
    ],
    videoUrl:
      "https://www.youtube.com/results?search_query=kapotasana+king+pigeon",
  },
  {
    id: "paschimottanasana",
    englishName: "Seated Forward Bend",
    sanskritName: "Paschimottanasana",
    difficulty: "beginner",
    category: "seated",
    imageUrl:
      "/static/uploads/Seated_Forward_Bend_pose_or_Paschimottanasana_.jpg",
    benefits: [
      "Stretches spine, shoulders, and hamstrings",
      "Stimulates liver, kidneys, and ovaries",
      "Improves digestion",
      "Calms the brain and relieves stress",
      "Relieves symptoms of menopause",
    ],
    risks: [
      "Avoid with asthma or diarrhea",
      "Those with back injuries should not go deep",
      "Pregnant women should keep legs apart",
      "Use props if hamstrings are tight",
    ],
    videoUrl: "https://www.youtube.com/results?search_query=paschimottanasana",
  },
  {
    id: "vasisthasana",
    englishName: "Side Plank Pose",
    sanskritName: "Vasisthasana",
    difficulty: "intermediate",
    category: "balancing",
    imageUrl: "/static/uploads/Side_Plank_Pose_or_Vasisthasana_.webp",
    benefits: [
      "Strengthens arms, wrists, and core",
      "Improves balance and concentration",
      "Stretches wrists",
      "Tones the body",
      "Builds endurance",
    ],
    risks: [
      "Avoid with wrist, elbow, or shoulder injuries",
      "Those with arm or wrist injuries should modify",
      "Be cautious with balance issues",
      "Do not let hips sag",
    ],
    videoUrl:
      "https://www.youtube.com/results?search_query=vasisthasana+side+plank",
  },
  {
    id: "sukhasana",
    englishName: "Easy Pose",
    sanskritName: "Sukhasana",
    difficulty: "beginner",
    category: "seated",
    imageUrl: "/static/uploads/Sitting_pose_1_(normal).jpg",
    benefits: [
      "Opens hips and lengthens spine",
      "Calms the mind",
      "Strengthens back",
      "Improves posture",
      "Reduces stress and anxiety",
    ],
    risks: [
      "Those with knee problems should use props",
      "Be cautious with hip injuries",
      "Use cushion to elevate hips if needed",
      "May be uncomfortable for those with tight hips",
    ],
    videoUrl:
      "https://www.youtube.com/results?search_query=sukhasana+easy+pose",
  },
  {
    id: "dandasana",
    englishName: "Staff Pose",
    sanskritName: "Dandasana",
    difficulty: "beginner",
    category: "seated",
    imageUrl: "/static/uploads/Staff_Pose_or_Dandasana_.jpeg",
    benefits: [
      "Improves posture",
      "Strengthens back muscles",
      "Stretches shoulders and chest",
      "Prepares for other seated poses",
      "Grounds and centers the mind",
    ],
    risks: [
      "Those with lower back issues should sit on blanket",
      "Be cautious with wrist injuries",
      "Use wall for back support if needed",
      "May be challenging for those with tight hamstrings",
    ],
    videoUrl:
      "https://www.youtube.com/results?search_query=dandasana+staff+pose",
  },
  {
    id: "uttanasana",
    englishName: "Standing Forward Bend",
    sanskritName: "Uttanasana",
    difficulty: "beginner",
    category: "standing",
    imageUrl: "/static/uploads/Standing_Forward_Bend_pose_or_Uttanasana_.webp",
    benefits: [
      "Stretches hips, hamstrings, and calves",
      "Strengthens thighs and knees",
      "Calms the brain and relieves stress",
      "Stimulates liver and kidneys",
      "Improves digestion",
    ],
    risks: [
      "Avoid with back injuries",
      "Those with hamstring injuries should bend knees",
      "Be cautious if you have glaucoma",
      "Come up slowly to avoid dizziness",
    ],
    videoUrl: "https://www.youtube.com/results?search_query=uttanasana",
  }
);

// Add remaining asanas to complete the collection (82 total)
asanas.push(
  {
    id: "pasasana",
    englishName: "Noose Pose",
    sanskritName: "Pasasana",
    difficulty: "advanced",
    category: "standing",
    imageUrl: "/static/uploads/Noose_Pose_or_Pasasana_.jpeg",
    benefits: [
      "Stretches and strengthens ankles",
      "Opens shoulders and chest",
      "Improves digestion",
      "Tones abdominal organs",
      "Increases spinal flexibility",
    ],
    risks: [
      "Not for beginners",
      "Avoid with knee or lower back injuries",
      "Those with herniated discs should skip",
      "Requires good ankle flexibility",
    ],
    videoUrl: "https://www.youtube.com/results?search_query=pasasana+noose",
  },
  {
    id: "eka_pada_koundinyanasana",
    englishName: "Pose Dedicated to Sage Koundinya",
    sanskritName: "Eka Pada Koundinyanasana",
    difficulty: "advanced",
    category: "balancing",
    imageUrl:
      "/static/uploads/Pose_Dedicated_to_the_Sage_Koundinya_or_Eka_Pada_Koundinyanasana_I_and_II.png",
    benefits: [
      "Strengthens arms, wrists, and core",
      "Improves balance and coordination",
      "Tones abdominal muscles",
      "Builds confidence and focus",
      "Stretches hips and legs",
    ],
    risks: [
      "Not for beginners",
      "Avoid with wrist, elbow, or shoulder injuries",
      "Those with lower back problems should skip",
      "Requires strong core and upper body",
    ],
    videoUrl:
      "https://www.youtube.com/results?search_query=eka+pada+koundinyanasana",
  },
  {
    id: "rajakapotasana",
    englishName: "King Pigeon Pose",
    sanskritName: "Rajakapotasana",
    difficulty: "advanced",
    category: "backbend",
    imageUrl: "/static/uploads/Rajakapotasana.jpg",
    benefits: [
      "Deep hip and chest opener",
      "Stretches thighs, groin, and psoas",
      "Stimulates abdominal organs",
      "Opens chest and shoulders",
      "Improves posture",
    ],
    risks: [
      "Not for beginners",
      "Avoid with serious knee or back injuries",
      "Those with ankle problems should modify",
      "Be very cautious with sacroiliac issues",
      "Requires proper warm-up",
    ],
    videoUrl: "https://www.youtube.com/results?search_query=rajakapotasana",
  },
  {
    id: "supta_padangusthasana",
    englishName: "Reclining Hand-to-Big-Toe Pose",
    sanskritName: "Supta Padangusthasana",
    difficulty: "beginner",
    category: "seated",
    imageUrl:
      "/static/uploads/Reclining_Hand-to-Big-Toe_Pose_or_Supta_Padangusthasana_.avif",
    benefits: [
      "Stretches hips, thighs, hamstrings, and calves",
      "Strengthens the knees",
      "Relieves backache and sciatica",
      "Stimulates prostate gland",
      "Improves digestion",
    ],
    risks: [
      "Avoid with diarrhea",
      "Those with high blood pressure should keep head elevated",
      "Use strap if you cannot reach foot",
      "Be gentle with hamstring injuries",
    ],
    videoUrl:
      "https://www.youtube.com/results?search_query=supta+padangusthasana",
  },
  {
    id: "parivrtta_janu_sirsasana",
    englishName: "Revolved Head-to-Knee Pose",
    sanskritName: "Parivrtta Janu Sirsasana",
    difficulty: "intermediate",
    category: "seated",
    imageUrl:
      "/static/uploads/Revolved_Head-to-Knee_Pose_or_Parivrtta_Janu_Sirsasana_.avif",
    benefits: [
      "Stretches spine, shoulders, and hamstrings",
      "Stimulates abdominal organs",
      "Improves digestion",
      "Calms the brain",
      "Relieves anxiety",
    ],
    risks: [
      "Avoid with back or knee injuries",
      "Those with asthma should be cautious",
      "Not recommended with diarrhea",
      "Use props if flexibility is limited",
    ],
    videoUrl:
      "https://www.youtube.com/results?search_query=parivrtta+janu+sirsasana",
  },
  {
    id: "tolasana",
    englishName: "Scale Pose",
    sanskritName: "Tolasana",
    difficulty: "intermediate",
    category: "balancing",
    imageUrl: "/static/uploads/Scale_Pose_or_Tolasana_.jpg",
    benefits: [
      "Strengthens arms, wrists, and abdomen",
      "Tones abdominal organs",
      "Improves balance",
      "Builds core strength",
      "Develops focus and determination",
    ],
    risks: [
      "Avoid with wrist or shoulder injuries",
      "Those with carpal tunnel should skip",
      "Not recommended for those with shoulder problems",
      "Use blocks under hands if needed",
    ],
    videoUrl:
      "https://www.youtube.com/results?search_query=tolasana+scale+pose",
  },
  {
    id: "vrischikasana",
    englishName: "Scorpion Pose",
    sanskritName: "Vrischikasana",
    difficulty: "advanced",
    category: "inversion",
    imageUrl: "/static/uploads/Scorpion_pose_or_vrischikasana.avif",
    benefits: [
      "Strengthens arms, shoulders, and back",
      "Improves balance and concentration",
      "Opens chest and shoulders",
      "Stimulates abdominal organs",
      "Builds confidence and mental fortitude",
    ],
    risks: [
      "Only for advanced practitioners",
      "Avoid with back, neck, or shoulder injuries",
      "Not recommended for high blood pressure",
      "Can cause serious injury if done incorrectly",
      "Practice with qualified instructor",
    ],
    videoUrl:
      "https://www.youtube.com/results?search_query=vrischikasana+scorpion",
  },
  {
    id: "bhujapidasana",
    englishName: "Shoulder-Pressing Pose",
    sanskritName: "Bhujapidasana",
    difficulty: "advanced",
    category: "balancing",
    imageUrl: "/static/uploads/Shoulder-Pressing_Pose_or_Bhujapidasana_.jpeg",
    benefits: [
      "Strengthens arms and wrists",
      "Tones abdominal organs",
      "Improves balance and concentration",
      "Builds core strength",
      "Develops upper body power",
    ],
    risks: [
      "Not for beginners",
      "Avoid with wrist, elbow, or shoulder injuries",
      "Those with lower back problems should skip",
      "Requires significant strength and flexibility",
    ],
    videoUrl: "https://www.youtube.com/results?search_query=bhujapidasana",
  },
  {
    id: "anantasana",
    englishName: "Side-Reclining Leg Lift",
    sanskritName: "Anantasana",
    difficulty: "intermediate",
    category: "seated",
    imageUrl:
      "/static/uploads/Side-Reclining_Leg_Lift_pose_or_Anantasana_.jpeg",
    benefits: [
      "Stretches hamstrings and sides of torso",
      "Strengthens core muscles",
      "Improves balance",
      "Tones legs",
      "Stimulates abdominal organs",
    ],
    risks: [
      "Avoid with neck problems",
      "Those with shoulder injuries should modify",
      "Be cautious with lower back issues",
      "Use strap if you cannot reach foot",
    ],
    videoUrl: "https://www.youtube.com/results?search_query=anantasana",
  },
  {
    id: "parsva_bakasana",
    englishName: "Side Crow Pose",
    sanskritName: "Parsva Bakasana",
    difficulty: "advanced",
    category: "balancing",
    imageUrl: "/static/uploads/Side_Crane_(Crow)Pose_or_Parsva_Bakasana.jpg",
    benefits: [
      "Strengthens arms, wrists, and core",
      "Improves balance and coordination",
      "Tones abdominal organs",
      "Builds mental focus",
      "Stretches spine",
    ],
    risks: [
      "Not for beginners",
      "Avoid with wrist or shoulder injuries",
      "Those with lower back problems should skip",
      "Use padding under hands",
      "Can cause wrist strain",
    ],
    videoUrl: "https://www.youtube.com/results?search_query=parsva+bakasana",
  },
  {
    id: "hanumanasana",
    englishName: "Monkey God Pose (Splits)",
    sanskritName: "Hanumanasana",
    difficulty: "advanced",
    category: "seated",
    imageUrl: "/static/uploads/Split_pose.png",
    benefits: [
      "Stretches thighs, hamstrings, and groins",
      "Stimulates abdominal organs",
      "Improves flexibility",
      "Opens hips",
      "Builds patience and determination",
    ],
    risks: [
      "Not for beginners",
      "Avoid with hamstring or groin injuries",
      "Those with hip problems should skip",
      "Use blocks and props for support",
      "Requires extensive warm-up",
    ],
    videoUrl:
      "https://www.youtube.com/results?search_query=hanumanasana+splits",
  },
  {
    id: "urdhva_prasarita_eka_padasana",
    englishName: "Standing Split",
    sanskritName: "Urdhva Prasarita Eka Padasana",
    difficulty: "advanced",
    category: "balancing",
    imageUrl:
      "/static/uploads/Standing_Split_pose_or_Urdhva_Prasarita_Eka_Padasana_.png",
    benefits: [
      "Stretches hamstrings and calves",
      "Strengthens standing leg",
      "Improves balance and focus",
      "Calms the brain",
      "Stimulates liver and kidneys",
    ],
    risks: [
      "Avoid with hamstring or lower back injuries",
      "Those with high blood pressure should be cautious",
      "Use blocks for hands if needed",
      "Do not force the leg higher",
    ],
    videoUrl: "https://www.youtube.com/results?search_query=standing+split",
  },
  {
    id: "utthita_padangusthasana",
    englishName: "Standing Big Toe Hold",
    sanskritName: "Utthita Padangusthasana",
    difficulty: "intermediate",
    category: "balancing",
    imageUrl:
      "/static/uploads/Standing_big_toe_hold_pose_or_Utthita_Padangusthasana.jpg",
    benefits: [
      "Strengthens legs and ankles",
      "Stretches hamstrings and calves",
      "Improves balance and concentration",
      "Stimulates abdominal organs",
      "Builds mental focus",
    ],
    risks: [
      "Avoid with ankle or knee injuries",
      "Those with lower back problems should use strap",
      "Be cautious with balance issues",
      "Use wall for support if needed",
    ],
    videoUrl:
      "https://www.youtube.com/results?search_query=utthita+padangusthasana",
  },
  {
    id: "salamba_sirsasana",
    englishName: "Supported Headstand",
    sanskritName: "Salamba Sirsasana",
    difficulty: "advanced",
    category: "inversion",
    imageUrl:
      "/static/uploads/Supported_Headstand_pose_or_Salamba_Sirsasana_.avif",
    benefits: [
      "Strengthens arms, legs, and spine",
      "Improves digestion",
      "Increases blood flow to brain",
      "Calms the brain and relieves stress",
      "Stimulates pituitary and pineal glands",
    ],
    risks: [
      "Not for beginners without supervision",
      "Avoid with back, neck, or shoulder injuries",
      "Not recommended for high blood pressure",
      "Avoid during menstruation and pregnancy",
      "Can cause serious injury if done incorrectly",
    ],
    videoUrl:
      "https://www.youtube.com/results?search_query=headstand+sirsasana",
  },
  {
    id: "salamba_sarvangasana",
    englishName: "Supported Shoulderstand",
    sanskritName: "Salamba Sarvangasana",
    difficulty: "intermediate",
    category: "inversion",
    imageUrl:
      "/static/uploads/Supported_Shoulderstand_pose_or_Salamba_Sarvangasana_.jpg",
    benefits: [
      "Calms the brain and nervous system",
      "Stimulates thyroid and abdominal organs",
      "Stretches shoulders and neck",
      "Improves digestion",
      "Relieves stress and mild depression",
    ],
    risks: [
      "Avoid with neck injuries",
      "Not recommended during menstruation",
      "Those with high blood pressure should skip",
      "Do not turn head while in pose",
      "Use blankets under shoulders",
    ],
    videoUrl:
      "https://www.youtube.com/results?search_query=shoulderstand+sarvangasana",
  },
  {
    id: "supta_baddha_konasana",
    englishName: "Reclining Bound Angle Pose",
    sanskritName: "Supta Baddha Konasana",
    difficulty: "beginner",
    category: "seated",
    imageUrl: "/static/uploads/Supta_Baddha_Konasana_.webp",
    benefits: [
      "Opens hips, groin, and chest",
      "Stimulates abdominal organs",
      "Relieves menstrual cramps",
      "Reduces fatigue and stress",
      "Promotes relaxation",
    ],
    risks: [
      "Avoid with groin or knee injuries",
      "Use props under knees for support",
      "Those with lower back problems should elevate torso",
      "Be gentle if you have hip issues",
    ],
    videoUrl:
      "https://www.youtube.com/results?search_query=supta+baddha+konasana",
  },
  {
    id: "supta_virasana",
    englishName: "Reclining Hero Pose",
    sanskritName: "Supta Virasana",
    difficulty: "intermediate",
    category: "seated",
    imageUrl: "/static/uploads/Supta_Virasana_Vajrasana.webp",
    benefits: [
      "Stretches abdomen, thighs, and ankles",
      "Strengthens arches of feet",
      "Relieves tired legs",
      "Improves digestion",
      "Helps with respiratory problems",
    ],
    risks: [
      "Avoid with serious knee, ankle, or back problems",
      "Those with heart problems should not lie back fully",
      "Use props for support",
      "Come out if you feel pain in knees",
    ],
    videoUrl: "https://www.youtube.com/results?search_query=supta+virasana",
  },
  {
    id: "kurmasana",
    englishName: "Tortoise Pose",
    sanskritName: "Kurmasana",
    difficulty: "advanced",
    category: "seated",
    imageUrl: "/static/uploads/Tortoise_Pose.jpeg",
    benefits: [
      "Deeply stretches back and legs",
      "Calms the nervous system",
      "Stimulates abdominal organs",
      "Relieves stress",
      "Improves flexibility",
    ],
    risks: [
      "Not for beginners",
      "Avoid with back, shoulder, or hamstring injuries",
      "Those with sciatica should skip",
      "Requires significant flexibility",
      "Do not force the stretch",
    ],
    videoUrl: "https://www.youtube.com/results?search_query=kurmasana+tortoise",
  },
  {
    id: "urdhva_dhanurasana",
    englishName: "Upward Bow (Wheel) Pose",
    sanskritName: "Urdhva Dhanurasana",
    difficulty: "advanced",
    category: "backbend",
    imageUrl:
      "/static/uploads/Upward_Bow_(Wheel)Pose_or_Urdhva_Dhanurasana.jpg",
    benefits: [
      "Strengthens arms, legs, spine, and abdomen",
      "Stretches chest and lungs",
      "Stimulates thyroid and pituitary",
      "Increases energy and counteracts depression",
      "Opens heart and shoulders",
    ],
    risks: [
      "Not for beginners",
      "Avoid with back, wrist, or shoulder injuries",
      "Not recommended for high or low blood pressure",
      "Avoid with carpal tunnel",
      "Requires proper warm-up",
    ],
    videoUrl: "https://www.youtube.com/results?search_query=wheel+pose",
  },
  {
    id: "dwi_pada_viparita_dandasana",
    englishName: "Upward Facing Two-Foot Staff Pose",
    sanskritName: "Dwi Pada Viparita Dandasana",
    difficulty: "advanced",
    category: "backbend",
    imageUrl:
      "/static/uploads/Upward_Facing_Two-Foot_Staff_Pose_or_Dwi_Pada_Viparita_Dandasana_.avif",
    benefits: [
      "Deep chest and shoulder opener",
      "Strengthens spine and legs",
      "Stimulates thyroid",
      "Increases spinal flexibility",
      "Builds strength and stamina",
    ],
    risks: [
      "Only for advanced practitioners",
      "Avoid with serious back or neck injuries",
      "Not recommended for high blood pressure",
      "Requires extensive preparation",
      "Should be learned with qualified teacher",
    ],
    videoUrl:
      "https://www.youtube.com/results?search_query=dwi+pada+viparita+dandasana",
  },
  {
    id: "purvottanasana",
    englishName: "Upward Plank Pose",
    sanskritName: "Purvottanasana",
    difficulty: "intermediate",
    category: "backbend",
    imageUrl: "/static/uploads/Upward_Plank_Pose_or_Purvottanasana_.jpeg",
    benefits: [
      "Strengthens arms, wrists, and legs",
      "Stretches shoulders, chest, and front ankles",
      "Improves posture",
      "Stimulates thyroid",
      "Opens chest and heart",
    ],
    risks: [
      "Avoid with wrist or shoulder injuries",
      "Those with neck problems should not drop head back",
      "Be cautious with ankle injuries",
      "Keep core engaged to protect lower back",
    ],
    videoUrl: "https://www.youtube.com/results?search_query=purvottanasana",
  },
  {
    id: "vajrasana",
    englishName: "Thunderbolt Pose",
    sanskritName: "Vajrasana",
    difficulty: "beginner",
    category: "seated",
    imageUrl: "/static/uploads/Virasana_or_Vajrasana.png",
    benefits: [
      "Aids digestion",
      "Strengthens pelvic muscles",
      "Relieves gas and acidity",
      "Improves posture",
      "Calms the mind",
    ],
    risks: [
      "Avoid with serious knee or ankle injuries",
      "Those with heel spurs should use caution",
      "Use cushion between feet and buttocks if needed",
      "May be uncomfortable initially",
    ],
    videoUrl: "https://www.youtube.com/results?search_query=vajrasana",
  },
  {
    id: "virabhadrasana_3",
    englishName: "Warrior III",
    sanskritName: "Virabhadrasana III",
    difficulty: "intermediate",
    category: "balancing",
    imageUrl: "/static/uploads/Warrior_III_Pose_or_Virabhadrasana_III_.avif",
    benefits: [
      "Improves balance and posture",
      "Strengthens ankles, legs, and back",
      "Tones abdominal muscles",
      "Improves focus and concentration",
      "Builds stamina",
    ],
    risks: [
      "Avoid with high blood pressure",
      "Those with balance issues should use wall",
      "Be cautious with ankle or knee injuries",
      "Keep hips level",
    ],
    videoUrl: "https://www.youtube.com/results?search_query=warrior+3+pose",
  },
  {
    id: "virabhadrasana_2",
    englishName: "Warrior II",
    sanskritName: "Virabhadrasana II",
    difficulty: "beginner",
    category: "standing",
    imageUrl: "/static/uploads/Warrior_II_Pose_or_Virabhadrasana_II_.webp",
    benefits: [
      "Strengthens and stretches legs and ankles",
      "Opens hips and chest",
      "Improves concentration and balance",
      "Stimulates abdominal organs",
      "Increases stamina",
    ],
    risks: [
      "Be cautious with knee problems",
      "Avoid if you have diarrhea",
      "Those with neck problems should not turn head",
      "Keep front knee over ankle",
    ],
    videoUrl: "https://www.youtube.com/results?search_query=warrior+2+pose",
  },
  {
    id: "upavistha_konasana",
    englishName: "Wide-Angle Seated Forward Bend",
    sanskritName: "Upavistha Konasana",
    difficulty: "intermediate",
    category: "seated",
    imageUrl:
      "/static/uploads/Wide-Angle_Seated_Forward_Bend_pose_or_Upavistha_Konasana_.jpeg",
    benefits: [
      "Stretches insides and backs of legs",
      "Stimulates abdominal organs",
      "Strengthens spine",
      "Calms the brain",
      "Releases groins",
    ],
    risks: [
      "Avoid with lower back injuries",
      "Those with hamstring issues should use props",
      "Be cautious with sciatica",
      "Do not force the forward bend",
    ],
    videoUrl: "https://www.youtube.com/results?search_query=upavistha+konasana",
  },
  {
    id: "prasarita_padottanasana",
    englishName: "Wide-Legged Forward Bend",
    sanskritName: "Prasarita Padottanasana",
    difficulty: "beginner",
    category: "standing",
    imageUrl:
      "/static/uploads/Wide-Legged_Forward_Bend_pose_or_Prasarita_Padottanasana_.png",
    benefits: [
      "Stretches hamstrings and spine",
      "Strengthens and stretches inner and back legs",
      "Tones abdominal organs",
      "Calms the brain",
      "Relieves mild backache",
    ],
    risks: [
      "Avoid with lower back problems",
      "Those with hamstring injuries should modify",
      "Be cautious if you have high blood pressure",
      "Use blocks if hands don't reach floor",
    ],
    videoUrl:
      "https://www.youtube.com/results?search_query=prasarita+padottanasana",
  },
  {
    id: "camatkarasana",
    englishName: "Wild Thing",
    sanskritName: "Camatkarasana",
    difficulty: "intermediate",
    category: "backbend",
    imageUrl: "/static/uploads/Wild_Thing_pose_or_Camatkarasana_.webp",
    benefits: [
      "Opens chest, lungs, and shoulders",
      "Strengthens arms and legs",
      "Increases spinal flexibility",
      "Energizes and uplifts",
      "Builds confidence",
    ],
    risks: [
      "Avoid with wrist, shoulder, or neck injuries",
      "Not recommended for those with back problems",
      "Those with high blood pressure should be cautious",
      "Requires strong foundation in downward dog",
    ],
    videoUrl:
      "https://www.youtube.com/results?search_query=camatkarasana+wild+thing",
  },
  {
    id: "pawanmuktasana",
    englishName: "Wind Relieving Pose",
    sanskritName: "Pawanmuktasana",
    difficulty: "beginner",
    category: "seated",
    imageUrl: "/static/uploads/Wind_Relieving_pose_or_Pawanmuktasana.jpg",
    benefits: [
      "Relieves gas and bloating",
      "Massages abdominal organs",
      "Stretches lower back",
      "Improves digestion",
      "Relieves constipation",
    ],
    risks: [
      "Avoid if pregnant",
      "Those with hernia should skip",
      "Be cautious with recent abdominal surgery",
      "Do not practice on full stomach",
    ],
    videoUrl: "https://www.youtube.com/results?search_query=pawanmuktasana",
  },
  {
    id: "viparita_virabhadrasana",
    englishName: "Reverse Warrior Pose",
    sanskritName: "Viparita Virabhadrasana",
    difficulty: "beginner",
    category: "standing",
    imageUrl:
      "/static/uploads/viparita_virabhadrasana_or_reverse_warrior_pose.png",
    benefits: [
      "Stretches side body and intercostals",
      "Opens chest and shoulders",
      "Strengthens legs",
      "Improves balance",
      "Energizes the body",
    ],
    risks: [
      "Avoid with serious shoulder injuries",
      "Those with neck problems should not look up",
      "Be cautious with lower back issues",
      "Keep front knee aligned over ankle",
    ],
    videoUrl:
      "https://www.youtube.com/results?search_query=reverse+warrior+pose",
  },
  {
    id: "yogic_sleep_pose",
    englishName: "Yogic Sleep Pose",
    sanskritName: "Yoga Nidrasana",
    difficulty: "advanced",
    category: "seated",
    imageUrl: "/static/uploads/Yogic_sleep_pose.webp",
    benefits: [
      "Deeply relaxes the nervous system",
      "Promotes conscious sleep state",
      "Reduces stress and anxiety",
      "Improves mental clarity",
      "Enhances self-awareness",
    ],
    risks: [
      "Not suitable for beginners",
      "Avoid with serious back injuries",
      "Those with hip problems should skip",
      "Requires guidance from experienced teacher",
      "May cause discomfort if forced",
    ],
    videoUrl: "https://www.youtube.com/results?search_query=yoga+nidrasana",
  }
);

let filteredAsanas = [...asanas];

// DOM elements
const searchInput = document.getElementById("searchInput");
const filterButtons = document.querySelectorAll(".filter-btn");
const asanaGrid = document.getElementById("asanaGrid");
const resultsCount = document.getElementById("resultsCount");
const noResults = document.getElementById("noResults");

// Handle image loading errors
function handleImageError(img) {
  img.style.display = "none";
  const fallback = img.nextElementSibling;
  if (fallback && fallback.classList.contains("imageUrl")) {
    fallback.style.display = "block";
  }
}

// Updated openAsanaDetails function
function openAsanaDetails(asanaId) {
  const asana = asanas.find((a) => a.id === asanaId);
  if (!asana) return;

  const modal = document.getElementById("modal");
  const modalContent = document.getElementById("modalContent");

  // Get difficulty badge color
  const difficultyColors = {
    beginner: "#22c55e",
    intermediate: "#f59e0b",
    advanced: "#ef4444",
  };

  modalContent.innerHTML = `
          <div class="modal-header">
            <h2 class="modal-title">${asana.sanskritName}</h2>
            <p class="modal-sanskrit">${asana.englishName}</p>
            <div class="modal-tags">
              <span class="modal-tag">${asana.difficulty}</span>
              <span class="modal-tag">${asana.category}</span>
            </div>
          </div>
          <div class="modal-body">
            <div class="modal-sections">
              <div class="modal-section">
                <h3 class="modal-section-title">
                  <span class="icon">✨</span>
                  <span>Benefits</span>
                </h3>
                <ul class="modal-list benefits-list">
                  ${asana.benefits
                    .map(
                      (benefit) => `
                    <li>
                      <span class="bullet">•</span>
                      <span>${benefit}</span>
                    </li>
                  `
                    )
                    .join("")}
                </ul>
              </div>

              <div class="modal-section">
                <h3 class="modal-section-title">
                  <span class="icon">⚠️</span>
                  <span>Precautions & Risks</span>
                </h3>
                <ul class="modal-list risks-list">
                  ${asana.risks
                    .map(
                      (risk) => `
                    <li>
                      <span class="bullet">•</span>
                      <span>${risk}</span>
                    </li>
                  `
                    )
                    .join("")}
                </ul>
              </div>
            </div>

            <a href="${asana.videoUrl}" target="_blank" class="video-button">
              📺 Watch Video Tutorial
            </a>
          </div>
        `;

  modal.classList.add("active");
}
// Close modal function
function closeModal() {
  const modal = document.getElementById("modal");
  modal.classList.remove("active");
}

// Close modal when clicking outside
document.addEventListener("click", function (e) {
  const modal = document.getElementById("modal");
  if (e.target === modal) {
    closeModal();
  }
});

// Close modal with Escape key
document.addEventListener("keydown", function (e) {
  if (e.key === "Escape") {
    closeModal();
  }
});

// Initialize the page
function init() {
  renderAsanas();
  setupEventListeners();
}

// Setup event listeners
function setupEventListeners() {
  searchInput.addEventListener("input", handleSearch);
  filterButtons.forEach((btn) => {
    btn.addEventListener("click", handleFilter);
  });
}

// Handle search
function handleSearch() {
  const query = searchInput.value.toLowerCase();
  filteredAsanas = asanas.filter(
    (asana) =>
      asana.englishName.toLowerCase().includes(query) ||
      asana.sanskritName.toLowerCase().includes(query)
  );
  renderAsanas();
}

// Handle filter
function handleFilter(e) {
  // Remove active class from all buttons
  filterButtons.forEach((btn) => btn.classList.remove("active"));
  // Add active class to clicked button
  e.target.classList.add("active");

  const filter = e.target.dataset.filter;

  if (filter === "all") {
    filteredAsanas = [...asanas];
  } else {
    filteredAsanas = asanas.filter(
      (asana) => asana.difficulty === filter || asana.category === filter
    );
  }

  renderAsanas();
}

// Render asanas
function renderAsanas() {
  // Update results count
  resultsCount.textContent = `Showing ${filteredAsanas.length} of ${asanas.length} poses`;

  // Show/hide no results message
  if (filteredAsanas.length === 0) {
    asanaGrid.style.display = "none";
    noResults.style.display = "block";
    return;
  } else {
    asanaGrid.style.display = "grid";
    noResults.style.display = "none";
  }

  // Render asana cards
  asanaGrid.innerHTML = filteredAsanas
    .map(
      (asana) => `
                <div class="asana-card" onclick="openAsanaDetails('${
                  asana.id
                }')">
                    <div class="asana-image">
                        <img src="${asana.imageUrl}" alt="${
        asana.englishName
      }" loading="lazy" onerror="this.style.display='none'; this.nextElementSibling.style.display='block';">
                        <span class="imageUrl" style="display: none;">🧘‍♀️</span>
                        <div class="difficulty-badge difficulty-${
                          asana.difficulty
                        }">
                            ${
                              asana.difficulty.charAt(0).toUpperCase() +
                              asana.difficulty.slice(1)
                            }
                        </div>
                    </div>
                    <div class="asana-content">
                        <h3 class="asana-name">${asana.sanskritName}</h3>
                        <p class="sanskrit-name">${asana.englishName}</p>
                        
                        <div class="benefits-section">
                            <div class="section-title">
                                <span>✨</span>
                                <span>Benefits</span>
                            </div>
                            <ul class="benefit-list">
                                ${asana.benefits
                                  .slice(0, 3)
                                  .map(
                                    (benefit) => `
                                    <li><span class="bullet">•</span>${benefit}</li>
                                `
                                  )
                                  .join("")}
                                ${
                                  asana.benefits.length > 3
                                    ? `<li class="benefit-more">+${
                                        asana.benefits.length - 3
                                      } more benefits</li>`
                                    : ""
                                }
                            </ul>
                        </div>
                        
                        <div class="category-badge">${
                          asana.category.charAt(0).toUpperCase() +
                          asana.category.slice(1)
                        }</div>
                    </div>
                </div>
            `
    )
    .join("");
}

// Initialize when DOM is loaded
document.addEventListener("DOMContentLoaded", init);
