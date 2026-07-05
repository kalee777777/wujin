/* ============================================
   HOLGENVY - Website Interactions
   ============================================ */

// === COMPONENT LOADER ===
async function loadComponent(url, targetId) {
    try {
        const response = await fetch(url);
        if (!response.ok) throw new Error(`Failed to load ${url}`);
        const html = await response.text();
        const target = document.getElementById(targetId);
        if (target) {
            target.innerHTML = html;
        }
    } catch (error) {
        console.error('Component load error:', error);
    }
}

async function loadAllComponents() {
    await Promise.all([
        loadComponent('components/header.html', 'site-header'),
        loadComponent('components/nav.html', 'site-nav'),
        loadComponent('components/footer.html', 'site-footer')
    ]);
    // Re-initialize interactions after components are loaded
    initInteractions();
}

// === INTERACTIONS INITIALIZER ===
function initInteractions() {

    // === MOBILE MENU TOGGLE ===
    const mobileToggle = document.getElementById('mobileToggle');
    const catNav = document.getElementById('catNav');

    if (mobileToggle && catNav) {
        mobileToggle.addEventListener('click', (e) => {
            e.stopPropagation();
            mobileToggle.classList.toggle('active');
            catNav.classList.toggle('active');
        });

        // Close nav when clicking outside
        document.addEventListener('click', (e) => {
            if (!mobileToggle.contains(e.target) && !catNav.contains(e.target)) {
                mobileToggle.classList.remove('active');
                catNav.classList.remove('active');
            }
        });
    }

    // === PRODUCT TABS ===
    const tabBtns = document.querySelectorAll('.tab-btn');
    const productCards = document.querySelectorAll('.product-card');

    tabBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            tabBtns.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');

            const tab = btn.getAttribute('data-tab');

            productCards.forEach(card => {
                const cardTab = card.getAttribute('data-tab');
                if (tab === 'all' || cardTab === tab) {
                    card.classList.remove('hidden');
                    card.style.opacity = '0';
                    card.style.transform = 'translateY(12px)';
                    requestAnimationFrame(() => {
                        card.style.transition = 'opacity 0.4s ease, transform 0.4s ease';
                        card.style.opacity = '1';
                        card.style.transform = 'translateY(0)';
                    });
                } else {
                    card.classList.add('hidden');
                }
            });
        });
    });

    // === NEWSLETTER FORM ===
    const newsletterForm = document.getElementById('newsletterForm');
    if (newsletterForm) {
        newsletterForm.addEventListener('submit', (e) => {
            e.preventDefault();
            const input = newsletterForm.querySelector('input');
            const btn = newsletterForm.querySelector('button');

            if (!input.value.trim()) return;

            const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
            if (!emailRegex.test(input.value.trim())) {
                input.style.borderColor = '#FF4444';
                setTimeout(() => { input.style.borderColor = ''; }, 2000);
                return;
            }

            btn.innerHTML = '<span>Subscribed!</span>';
            btn.style.background = '#22C55E';
            input.value = '';

            setTimeout(() => {
                btn.innerHTML = '<span>Subscribe</span>';
                btn.style.background = '';
            }, 3000);
        });
    }

    // === HERO DOTS ===
    const dots = document.querySelectorAll('.hero-dots .dot');
    dots.forEach((dot, index) => {
        dot.addEventListener('click', () => {
            dots.forEach(d => d.classList.remove('active'));
            dot.classList.add('active');
        });
    });

    // === SMOOTH SCROLL ===
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function(e) {
            e.preventDefault();
            const targetId = this.getAttribute('href');
            const target = document.querySelector(targetId);
            if (target) {
                const headerHeight = document.querySelector('.main-header')?.offsetHeight || 0;
                window.scrollTo({
                    top: target.offsetTop - headerHeight - 20,
                    behavior: 'smooth'
                });
            }
        });
    });

    // === SCROLL REVEAL ANIMATION ===
    const revealObserver = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.style.opacity = '1';
                entry.target.style.transform = 'translateY(0)';
                revealObserver.unobserve(entry.target);
            }
        });
    }, {
        threshold: 0.1,
        rootMargin: '0px 0px -40px 0px'
    });

    // Apply reveal to major sections
    const revealSections = document.querySelectorAll(
        '.shop-cats, .features-bar, .todays-deal, .featured-products, ' +
        '.promo-banner, .cat-grid-section, .full-banner, .best-sellers, ' +
        '.split-showcase, .service-icons, .recent-collections, .newsletter'
    );

    revealSections.forEach(section => {
        section.style.opacity = '0';
        section.style.transform = 'translateY(30px)';
        section.style.transition = 'opacity 0.7s ease, transform 0.7s ease';
        revealObserver.observe(section);
    });

    // === PRODUCT CARD HOVER GLOW ===
    productCards.forEach(card => {
        card.addEventListener('mouseenter', () => {
            card.style.borderColor = 'var(--neon)';
        });
        card.addEventListener('mouseleave', () => {
            if (!card.classList.contains('hidden')) {
                card.style.borderColor = '';
            }
        });
    });

    // === SEARCH BAR FOCUS ===
    const searchInput = document.querySelector('.search-bar input');
    if (searchInput) {
        searchInput.addEventListener('focus', () => {
            document.querySelector('.search-bar')?.classList.add('focused');
        });
        searchInput.addEventListener('blur', () => {
            document.querySelector('.search-bar')?.classList.remove('focused');
        });
    }

    // === ADD TO INQUIRY BUTTONS ===
    const inquiryBtns = document.querySelectorAll('.deal-card .btn-neon');
    inquiryBtns.forEach(btn => {
        btn.addEventListener('click', (e) => {
            e.preventDefault();
            const originalText = btn.innerHTML;
            btn.innerHTML = '<span>Added!</span>';
            btn.style.background = '#22C55E';

            // Update cart badge
            const badge = document.querySelector('.cart-badge');
            if (badge) {
                const current = parseInt(badge.textContent) || 0;
                badge.textContent = current + 1;
                badge.style.transform = 'scale(1.3)';
                setTimeout(() => { badge.style.transform = 'scale(1)'; }, 200);
            }

            setTimeout(() => {
                btn.innerHTML = originalText;
                btn.style.background = '';
            }, 1500);
        });
    });

    // === HEADER SHADOW ON SCROLL ===
    const mainHeader = document.getElementById('mainHeader');
    if (mainHeader) {
        window.addEventListener('scroll', () => {
            if (window.pageYOffset > 10) {
                mainHeader.style.boxShadow = '0 4px 30px rgba(0,0,0,0.6)';
            } else {
                mainHeader.style.boxShadow = 'none';
            }
        });
    }

    // === PROGRESS BAR ANIMATION ===
    const progressBars = document.querySelectorAll('.progress-fill');
    const progressObserver = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                const width = entry.target.style.width;
                entry.target.style.width = '0%';
                requestAnimationFrame(() => {
                    setTimeout(() => {
                        entry.target.style.transition = 'width 1.2s ease';
                        entry.target.style.width = width;
                    }, 200);
                });
                progressObserver.unobserve(entry.target);
            }
        });
    }, { threshold: 0.5 });

    progressBars.forEach(bar => progressObserver.observe(bar));

    // === PRODUCT PAGE FILTER ===
    const filterBtns = document.querySelectorAll('.filter-btn[data-filter]');
    const productCards = document.querySelectorAll('.product-page-card');
    const productCount = document.querySelector('.product-count strong');

    if (filterBtns.length && productCards.length) {
        filterBtns.forEach(btn => {
            btn.addEventListener('click', () => {
                // Update active state
                filterBtns.forEach(b => b.classList.remove('active'));
                btn.classList.add('active');

                const filter = btn.getAttribute('data-filter');
                let visible = 0;

                productCards.forEach(card => {
                    const cat = card.getAttribute('data-category');
                    if (filter === 'all' || cat === filter) {
                        card.classList.remove('hidden');
                        visible++;
                    } else {
                        card.classList.add('hidden');
                    }
                });

                if (productCount) {
                    productCount.textContent = visible;
                }
            });
        });
    }
}

// === INITIALIZE ===
document.addEventListener('DOMContentLoaded', () => {
    loadAllComponents();
});
