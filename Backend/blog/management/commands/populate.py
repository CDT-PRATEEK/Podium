import random
from django.contrib.auth.models import User
from django.db.models import Q
from blog.models import Post, Comment  # CHANGE 'api' to your app name

# === 1. THE BRAIN: TOPIC-SPECIFIC COMMENT POOLS ===
# Matches keywords in title -> Specific intellectual comments
topic_map = {
    # --- TECH & CODING (Gunther, Linus_2.0) ---
    "rust": [
        "The borrow checker was a nightmare at first, but now I can't go back to C++.",
        "Do you think Rust will ever fully replace C++ in game dev?",
        "Finally, someone explains ownership without overcomplicating it.",
        "Memory safety without garbage collection is the future."
    ],
    "linux": [
        "The CFS scheduler is brilliant, but I still tweak my nice values manually.",
        "Linus was right about namespaces. VMs are too heavy for microservices.",
        "Have you looked into eBPF? It's changing how we trace kernel events.",
        "Understanding the red-black tree structure in CFS changed how I code."
    ],
    "docker": [
        "Layer caching is the single most important thing to optimize here.",
        "I completely agree. People treat containers like lightweight VMs and it's wrong.",
        "What base image do you recommend for production Django apps?",
        "Alpine linux is great but the glibc compatibility issues are annoying."
    ],
    "kafka": [
        "RabbitMQ is easier for simple tasks, but Kafka's throughput is unmatched.",
        "Event sourcing with Kafka is complex but worth it for audit logs.",
        "How do you handle partition rebalancing in production?",
        "Exactly. Decoupling services is the only way to scale properly."
    ],
    "graphql": [
        "Over-fetching was killing our mobile app until we switched to GraphQL.",
        "The N+1 problem is real though. Dataloaders are mandatory.",
        "REST is definitely not dead, but GraphQL is superior for complex relationships.",
        "I miss the simplicity of HTTP caching with REST though."
    ],
    
    # --- PHILOSOPHY (Amrit, Tilbrit, ZenMaster) ---
    "sisyphus": [
        "Camus was right. The struggle itself towards the heights is enough to fill a man's heart.",
        "I always interpreted the boulder as our daily 9-5 grind.",
        "Imagine him happy? That is the hardest part.",
        "Existentialism isn't depressing, it's freeing."
    ],
    "stoic": [
        "Control what you can, ignore what you can't. Simple but hard.",
        "Marcus Aurelius would have hated social media.",
        "Amor Fati is the ultimate bio-hack for mental health.",
        "Seneca's letters are surprisingly relevant to modern corporate life."
    ],
    "pareto": [
        "I applied the 80/20 rule to my coding and realized 20% of bugs cause 80% of crashes.",
        "It's fractal too. The top 20% of the top 20% produce the most value.",
        "Dangerous if applied to relationships, but great for productivity.",
    ],
    
    # --- PHYSICS & SCIENCE (Sheldon, Rosalind) ---
    "quantum": [
        "If you think you understand quantum mechanics, you don't understand quantum mechanics.",
        "The observer effect is often misunderstood by pop-science.",
        "QFT is beautiful but the math is absolutely brutal.",
        "Are we ignoring Bohmian mechanics too easily?"
    ],
    "entropy": [
        "The arrow of time is the scariest concept in physics.",
        "Heat death is inevitable, so eat the cake.",
        "Information theory links entropy to coding in such a fascinating way.",
        "Boltzmann was a tragic genius."
    ],
    "gut": [
        "The vagus nerve connection explains so much about my anxiety.",
        "Serotonin production in the gut is a game changer for psychology.",
        "We really are just a host vehicle for our microbiome.",
    ],
    "epigenetics": [
        "Lamarck wasn't entirely wrong after all.",
        "The idea that trauma can be inherited is terrifying.",
        "DNA is the hardware, epigenetics is the software.",
    ],

    # --- ART & DESIGN (Jatin, Naman) ---
    "brutalism": [
        "Concrete isn't cold, it's honest.",
        "I hated Brutalism until I saw the Barbican in person.",
        "It was about ethics, not aesthetics. People forget that.",
        "Raw materials over decoration. A timeless principle."
    ],
    "bauhaus": [
        "Form follows function.",
        "Modern web design owes everything to the Bauhaus movement.",
        "Less is more.",
        "Kandinsky's color theory is still the gold standard."
    ],
    "color": [ # For Teal and Orange
        "The complimentary color contrast is why every blockbuster looks like this.",
        "It separates skin tones from the background perfectly.",
        "Overused? Maybe. Effective? Absolutely.",
    ],
    
    # --- SOCIOLOGY (Maya) ---
    "parasocial": [
        "Streamers feel like friends, and that is dangerous.",
        "It's the illusion of intimacy without the risk of rejection.",
        "We are lonely because we replaced third places with screens.",
        "This explains the obsession with celebrity culture."
    ]
}

# Fallback for posts that don't match specific keywords
generic_intellectual_pool = [
    "This is a very well-researched perspective.",
    "I hadn't considered the historical context before. Thanks.",
    "Do you have any book recommendations for diving deeper into this?",
    "Brilliantly written.",
    "I disagree with the premise, but the logic is sound.",
    "This reminds me of what Naval Ravikant talks about.",
    "Saved this to my reading list."
]

# === 2. SETUP USERS ===
# Exclude 'test', 'podium' and keep it safe
users = User.objects.exclude(username__in=['test', 'podium', 'admin'])
users = list(users)

if len(users) < 2:
    print("❌ Error: You need at least 2 valid users (excluding test/podium)!")
    exit()

posts = Post.objects.all()
print(f"🚀 Processing {posts.count()} posts...")

count_created = 0

for post in posts:
    # A. DETERMINE TOPIC
    title_lower = post.title.lower()
    selected_pool = generic_intellectual_pool # Default
    
    for key, comments in topic_map.items():
        if key in title_lower:
            selected_pool = comments
            break
            
    # B. RANDOM THREAD COUNT (0 to 5 threads per post)
    # Some posts (like Murphy's Law) might get more engagement naturally
    thread_count = random.randint(0, 5)
    
    op = post.author
    
    for _ in range(thread_count):
        # 1. Pick a Root Commenter (Someone who is NOT the OP)
        potential_commenters = [u for u in users if u != op]
        if not potential_commenters: continue # Skip if no valid users
        
        root_commenter = random.choice(potential_commenters)

        # 2. Create Root Comment
        root_comment = Comment.objects.create(
            post=post,
            author=root_commenter,
            text=random.choice(selected_pool)
        )
        count_created += 1
        
        # 3. Create Private Thread (Reply Chain)
        # Strict Rule: Only OP and Root Commenter can talk here
        reply_depth = random.randint(0, 3)
        last_author = root_commenter
        
        # Responses for the OP to give
        op_replies = [
            "Glad you enjoyed it!",
            "That's a valid counter-point.",
            "I'm planning a follow-up post on exactly that.",
            "Yes! You get it.",
            "Thanks for reading."
        ]
        
        # Responses for the Root Commenter to give back
        user_followups = [
            "Looking forward to it.",
            "Makes sense now.",
            "Exactly.",
            "Thanks for the clarification."
        ]
        
        for _ in range(reply_depth):
            # Toggle author: If last was User, now OP speaks.
            if last_author == root_commenter:
                current_author = op
                text = random.choice(op_replies)
            else:
                current_author = root_commenter
                text = random.choice(user_followups)
                
            Comment.objects.create(
                post=post,
                author=current_author,
                text=text,
                parent=root_comment # Attach all to root to keep it simple/clean
            )
            last_author = current_author
            count_created += 1

print(f"✅ Success! {count_created} intelligent comments created across {posts.count()} posts.")


