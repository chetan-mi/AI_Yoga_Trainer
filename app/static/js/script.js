// Smooth scrolling for navigation links
document.addEventListener("DOMContentLoaded", function () {
  // Mobile menu toggle
  const navToggle = document.querySelector(".nav-toggle");
  const navLinks = document.querySelector(".nav-links");

  if (navToggle && navLinks) {
    navToggle.addEventListener("click", function () {
      navLinks.classList.toggle("active");
      navToggle.classList.toggle("active");
    });
  }

  // Smooth scrolling for all anchor links
  const anchorLinks = document.querySelectorAll('a[href^="#"]');

  anchorLinks.forEach((link) => {
    link.addEventListener("click", function (e) {
      e.preventDefault();

      const targetId = this.getAttribute("href");
      const targetSection = document.querySelector(targetId);

      if (targetSection) {
        const offsetTop = targetSection.offsetTop - 70; // Account for fixed navbar

        window.scrollTo({
          top: offsetTop,
          behavior: "smooth",
        });

        // Close mobile menu if open
        if (navLinks && navLinks.classList.contains("active")) {
          navLinks.classList.remove("active");
          navToggle.classList.remove("active");
        }
      }
    });
  });

  // Navbar background change on scroll
  const navbar = document.querySelector(".navbar");

  window.addEventListener("scroll", function () {
    if (window.scrollY > 50) {
      navbar.style.background = "rgba(255, 255, 255, 0.98)";
      navbar.style.boxShadow = "0 2px 20px rgba(0, 0, 0, 0.1)";
    } else {
      navbar.style.background = "rgba(255, 255, 255, 0.95)";
      navbar.style.boxShadow = "none";
    }
  });

  // Button click animations
  const buttons = document.querySelectorAll(".btn");

  buttons.forEach((button) => {
    button.addEventListener("click", function (e) {
      // Create ripple effect
      const ripple = document.createElement("span");
      const rect = this.getBoundingClientRect();
      const size = Math.max(rect.width, rect.height);
      const x = e.clientX - rect.left - size / 2;
      const y = e.clientY - rect.top - size / 2;

      ripple.style.width = ripple.style.height = size + "px";
      ripple.style.left = x + "px";
      ripple.style.top = y + "px";
      ripple.classList.add("ripple");

      this.appendChild(ripple);

      // Remove ripple after animation
      setTimeout(() => {
        ripple.remove();
      }, 600);
    });
  });

  // Intersection Observer for fade-in animations
  const observerOptions = {
    threshold: 0.1,
    rootMargin: "0px 0px -50px 0px",
  };

  const observer = new IntersectionObserver(function (entries) {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        entry.target.style.opacity = "1";
        entry.target.style.transform = "translateY(0)";
      }
    });
  }, observerOptions);

  // Observe elements for animation
  const animatedElements = document.querySelectorAll(
    ".feature-card, .philosophy-quote, .importance-image, .highlight-box"
  );
  animatedElements.forEach((el) => {
    el.style.opacity = "0";
    el.style.transform = "translateY(30px)";
    el.style.transition = "opacity 0.6s ease, transform 0.6s ease";
    observer.observe(el);
  });

  // Parallax effect for hero background
  const heroBackground = document.querySelector(".hero-background");

  window.addEventListener("scroll", function () {
    const scrolled = window.pageYOffset;
    const rate = scrolled * -0.5;

    if (heroBackground) {
      heroBackground.style.transform = `translateY(${rate}px)`;
    }
  });

  // Add hover effects to feature cards
  const featureCards = document.querySelectorAll(".feature-card");

  featureCards.forEach((card) => {
    card.addEventListener("mouseenter", function () {
      this.style.transform = "translateY(-15px) scale(1.02)";
    });

    card.addEventListener("mouseleave", function () {
      this.style.transform = "translateY(0) scale(1)";
    });
  });

  // Add typing effect to hero title
  const heroTitle = document.querySelector(".hero-title");
  if (heroTitle) {
    const text = heroTitle.textContent;
    heroTitle.textContent = "";

    let i = 0;
    const typeWriter = () => {
      if (i < text.length) {
        heroTitle.textContent += text.charAt(i);
        i++;
        setTimeout(typeWriter, 50);
      }
    };

    // Start typing effect after a short delay
    setTimeout(typeWriter, 500);
  }

  // Add smooth reveal animation to philosophy quote
  const philosophyQuote = document.querySelector(".philosophy-quote");
  if (philosophyQuote) {
    const observer = new IntersectionObserver(
      function (entries) {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.style.animation = "fadeInUp 0.8s ease-out";
          }
        });
      },
      { threshold: 0.3 }
    );

    observer.observe(philosophyQuote);
  }
});
async function redirectToWebcam() {
  console.log("redirectToWebcam called");

  try {
    // Check if user is logged in by calling the auth_check API
    console.log("Checking user authentication...");
    const response = await fetch("/api/auth_check");

    console.log("API response status:", response.status);

    if (response.ok) {
      // User is logged in, redirect to webcam
      console.log("User is authenticated, redirecting to webcam");
      window.location.href = "/webcam";
    } else {
      // User is not logged in, redirect to login with next parameter
      console.log("User not authenticated, redirecting to login");
      window.location.href = "/login?next=" + encodeURIComponent("/webcam");
    }
  } catch (error) {
    // If API call fails, assume not logged in
    console.log("API call failed, assuming not logged in:", error);
    window.location.href = "/login?next=" + encodeURIComponent("/webcam");
  }
}

async function redirectToDashboard() {
  console.log("redirectToDashboard called");

  try {
    // Check if user is logged in by calling the auth_check API
    console.log("Checking user authentication...");
    const response = await fetch("/api/auth_check");

    console.log("API response status:", response.status);

    if (response.ok) {
      // User is logged in, redirect to dashboard
      console.log("User is authenticated, redirecting to dashboard");
      window.location.href = "/dashboard";
    } else {
      // User is not logged in, redirect to login with next parameter
      console.log("User not authenticated, redirecting to login");
      window.location.href = "/login?next=" + encodeURIComponent("/dashboard");
    }
  } catch (error) {
    // If API call fails, assume not logged in
    console.log("API call failed, assuming not logged in:", error);
    window.location.href = "/login?next=" + encodeURIComponent("/dashboard");
  }
}

// Add CSS for ripple effect and mobile menu
const style = document.createElement("style");
style.textContent = `
    .btn {
        position: relative;
        overflow: hidden;
    }
    
    .ripple {
        position: absolute;
        border-radius: 50%;
        background: rgba(255, 255, 255, 0.6);
        transform: scale(0);
        animation: ripple-animation 0.6s linear;
        pointer-events: none;
    }
    
    @keyframes ripple-animation {
        to {
            transform: scale(4);
            opacity: 0;
        }
    }
    
    .nav-links.active {
        display: flex;
        flex-direction: column;
        position: absolute;
        top: 100%;
        left: 0;
        width: 100%;
        background: rgba(255, 255, 255, 0.98);
        backdrop-filter: blur(10px);
        padding: 20px;
        box-shadow: 0 5px 20px rgba(0, 0, 0, 0.1);
    }
    
    .nav-toggle.active span:nth-child(1) {
        transform: rotate(-45deg) translate(-5px, 6px);
    }
    
    .nav-toggle.active span:nth-child(2) {
        opacity: 0;
    }
    
    .nav-toggle.active span:nth-child(3) {
        transform: rotate(45deg) translate(-5px, -6px);
    }
    
    .user-info {
        display: flex;
        align-items: center;
        gap: 10px;
    }
    
    .user-avatar {
        width: 32px;
        height: 32px;
        border-radius: 50%;
        object-fit: cover;
        border: 2px solid #22c55e;
    }
    
    .user-avatar-placeholder {
        width: 32px;
        height: 32px;
        border-radius: 50%;
        background: #f0f0f0;
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: 16px;
        border: 2px solid #22c55e;
    }
    
    .username {
        font-weight: 600;
        color: #333;
        font-size: 14px;
    }
    
    .btn-logout {
        background-color: #ef4444;
        color: white;
        padding: 6px 12px;
        border-radius: 6px;
        text-decoration: none;
        font-weight: 500;
        font-size: 14px;
        transition: background-color 0.3s ease;
    }
    
    .btn-logout:hover {
        background-color: #dc2626;
    }
    
    @media (max-width: 768px) {
        .nav-links {
            display: none;
        }
        
        .user-info {
            flex-direction: column;
            gap: 5px;
        }
        
        .username {
            font-size: 12px;
        }
    }
    
    @keyframes fadeInUp {
        from {
            opacity: 0;
            transform: translateY(30px);
        }
        to {
            opacity: 1;
            transform: translateY(0);
        }
    }
`;
document.head.appendChild(style);
