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

    // === HERO SIDEBAR CATEGORY SWITCH ===
    const sidebarCatLinks = document.querySelectorAll('.sidebar-cat-link');
    const heroPanels = document.querySelectorAll('.hero-slide[data-hero-panel]');

    if (sidebarCatLinks.length && heroPanels.length) {
        sidebarCatLinks.forEach(link => {
            link.addEventListener('click', (e) => {
                e.preventDefault();
                const cat = link.getAttribute('data-hero-cat');

                // Update active sidebar link
                sidebarCatLinks.forEach(l => l.classList.remove('active'));
                link.classList.add('active');

                // Switch hero panel
                heroPanels.forEach(panel => {
                    if (panel.getAttribute('data-hero-panel') === cat) {
                        panel.classList.add('active');
                        panel.style.opacity = '0';
                        requestAnimationFrame(() => {
                            panel.style.transition = 'opacity 0.5s ease';
                            panel.style.opacity = '1';
                        });
                    } else {
                        panel.classList.remove('active');
                        panel.style.opacity = '0';
                    }
                });
            });
        });
    }

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

    // === PRODUCT TABS (Bottom Featured Products) ===
    initHomeTabs('.featured-products:not(.featured-products-top)', 'data-tab', 'products.html');

    // === PRODUCT TABS TOP (Industry Categories) ===
    initHomeTabs('.featured-products-top', 'data-tab-top', 'industry.html');

    function initHomeTabs(containerSelector, dataAttr, targetPage) {
        const container = document.querySelector(containerSelector);
        if (!container) return;

        const tabBtns = container.querySelectorAll('.tab-btn');
        const allCards = Array.from(container.querySelectorAll('.product-card:not(.view-more-card)'));
        const grid = container.querySelector('.product-grid');
        let currentViewMore = null;

        tabBtns.forEach(btn => {
            btn.addEventListener('click', () => {
                tabBtns.forEach(b => b.classList.remove('active'));
                btn.classList.add('active');

                const tab = btn.getAttribute(dataAttr);

                // Remove old View More card
                if (currentViewMore && currentViewMore.parentNode) {
                    currentViewMore.remove();
                    currentViewMore = null;
                }

                // Filter matching cards
                let matching = [];
                if (tab === 'all') {
                    matching = allCards.slice(0, 8);
                } else {
                    matching = allCards.filter(card => card.getAttribute(dataAttr) === tab);
                }

                // Hide all cards first
                allCards.forEach(card => {
                    card.classList.add('hidden');
                    card.style.display = 'none';
                });

                // Show up to 7 matching cards
                const showCards = matching.slice(0, 7);
                showCards.forEach((card, index) => {
                    card.classList.remove('hidden');
                    card.style.display = '';
                    card.style.opacity = '0';
                    card.style.transform = 'translateY(12px)';
                    setTimeout(() => {
                        card.style.transition = 'opacity 0.4s ease, transform 0.4s ease';
                        card.style.opacity = '1';
                        card.style.transform = 'translateY(0)';
                    }, index * 50);
                });

                // Add View More if more than 7
                if (matching.length > 7 || (tab === 'all' && allCards.length > 7)) {
                    const totalInCategory = tab === 'all' ? allCards.length : matching.length;
                    const viewMore = document.createElement('div');
                    viewMore.className = 'product-card view-more-card';
                    viewMore.setAttribute(dataAttr, tab);
                    viewMore.innerHTML = `
                        <div class="product-img">
                            <a class="view-more-link" href="${targetPage}?category=${tab}">
                                <div class="view-more-content">
                                    <svg fill="none" height="32" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24" width="32"><polyline points="9 18 15 12 9 6"></polyline></svg>
                                    <span>View All</span>
                                    <small>${totalInCategory} products</small>
                                </div>
                            </a>
                        </div>
                        <div class="product-details">
                            <span class="p-cat">${tab === 'all' ? 'All' : btn.textContent}</span>
                            <h4>View More Products</h4>
                        </div>
                    `;
                    grid.appendChild(viewMore);
                    currentViewMore = viewMore;

                    viewMore.style.opacity = '0';
                    viewMore.style.transform = 'translateY(12px)';
                    setTimeout(() => {
                        viewMore.style.transition = 'opacity 0.4s ease, transform 0.4s ease';
                        viewMore.style.opacity = '1';
                        viewMore.style.transform = 'translateY(0)';
                    }, showCards.length * 50);
                }
            });
        });

        // Trigger initial tab (All)
        const allBtn = container.querySelector('.tab-btn[data-tab="all"], .tab-btn[data-tab-top="all"]');
        if (allBtn) allBtn.click();
    }

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
    const productCards = document.querySelectorAll('.product-card');
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
    const powerBtns = document.querySelectorAll('.power-btn[data-power]');
    const industryBtns = document.querySelectorAll('.power-btn[data-industry]');
    const productPageCards = document.querySelectorAll('.product-page-card');
    const productCount = document.querySelector('.product-count strong');

    let currentCategory = 'all';
    let currentPower = 'all';
    let currentIndustry = 'all';

    function applyFilters() {
        let visible = 0;
        productPageCards.forEach(card => {
            const cat = card.getAttribute('data-category');
            const power = card.getAttribute('data-power') || 'all';
            const industry = card.getAttribute('data-industry') || 'all';

            const matchCategory = currentCategory === 'all' || cat === currentCategory;
            const matchPower = currentPower === 'all' || power === currentPower;
            const matchIndustry = currentIndustry === 'all' || industry === currentIndustry;

            if (matchCategory && matchPower && matchIndustry) {
                card.classList.remove('hidden');
                visible++;
            } else {
                card.classList.add('hidden');
            }
        });

        if (productCount) {
            productCount.textContent = visible;
        }
    }

    if (filterBtns.length && productPageCards.length) {
        filterBtns.forEach(btn => {
            btn.addEventListener('click', () => {
                filterBtns.forEach(b => b.classList.remove('active'));
                btn.classList.add('active');
                currentCategory = btn.getAttribute('data-filter');
                applyFilters();
            });
        });
    }

    if (powerBtns.length && productPageCards.length) {
        powerBtns.forEach(btn => {
            btn.addEventListener('click', () => {
                powerBtns.forEach(b => b.classList.remove('active'));
                btn.classList.add('active');
                currentPower = btn.getAttribute('data-power');
                applyFilters();
            });
        });
    }

    if (industryBtns.length && productPageCards.length) {
        industryBtns.forEach(btn => {
            btn.addEventListener('click', () => {
                industryBtns.forEach(b => b.classList.remove('active'));
                btn.classList.add('active');
                currentIndustry = btn.getAttribute('data-industry');
                applyFilters();
            });
        });
    }

    // === PRODUCT PAGE PAGINATION ===
    initPagination();

    // === URL PARAMETER AUTO FILTER ===
    initUrlFilter();

    // === SHOP BY CATEGORY SCROLL SIZING ===
    initCatScroll();

    // === PRODUCT CARD CAROUSELS ===
    initCarousels();
}

// === SHOP BY CATEGORY SCROLL SIZING ===
function initCatScroll() {
    const wrapper = document.querySelector('.cats-scroll-wrapper');
    const track = document.querySelector('.cats-scroll-track');
    if (!wrapper || !track) return;

    function resize() {
        const wrapperW = wrapper.clientWidth;
        const gap = 20;
        const cols = window.innerWidth <= 480 ? 2 : window.innerWidth <= 992 ? 3 : 6;
        const itemW = (wrapperW - gap * (cols - 1)) / cols;
        track.querySelectorAll('.cat-item').forEach(item => {
            item.style.flex = '0 0 ' + itemW + 'px';
            item.style.maxWidth = itemW + 'px';
        });
    }

    resize();
    window.addEventListener('resize', resize);
}

// === URL PARAMETER AUTO FILTER ===
function initUrlFilter() {
    const params = new URLSearchParams(window.location.search);
    const category = params.get('category');
    if (!category) return;

    // Find matching filter button and click it
    const filterBtns = document.querySelectorAll('.filter-btn[data-filter]');
    filterBtns.forEach(btn => {
        if (btn.getAttribute('data-filter') === category) {
            btn.click();
        }
    });
}

// === PRODUCT PAGE PAGINATION ===
function initPagination() {
    const productsGrid = document.getElementById('productsGrid');
    const paginationContainer = document.querySelector('.pagination');
    if (!productsGrid || !paginationContainer) return;

    const ITEMS_PER_PAGE = 12;
    let currentPage = 1;

    function getVisibleCards() {
        return Array.from(productsGrid.querySelectorAll('.product-page-card:not(.hidden)'));
    }

    function renderPagination() {
        const visibleCards = getVisibleCards();
        const totalPages = Math.ceil(visibleCards.length / ITEMS_PER_PAGE);

        // Hide all cards first
        visibleCards.forEach(card => card.style.display = 'none');

        // Show cards for current page
        const start = (currentPage - 1) * ITEMS_PER_PAGE;
        const end = start + ITEMS_PER_PAGE;
        visibleCards.slice(start, end).forEach(card => card.style.display = '');

        // Re-generate pagination HTML
        if (totalPages <= 1) {
            paginationContainer.style.display = 'none';
            return;
        }
        paginationContainer.style.display = 'flex';

        let html = '';

        // Page numbers
        for (let i = 1; i <= totalPages; i++) {
            if (i === currentPage) {
                html += `<a class="page-btn active" href="#" data-page="${i}">${i}</a>`;
            } else {
                html += `<a class="page-btn" href="#" data-page="${i}">${i}</a>`;
            }
        }

        // Next button
        if (currentPage < totalPages) {
            html += `<a class="page-btn next" href="#" data-page="next">Next <svg fill="none" height="14" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24" width="14"><polyline points="9 18 15 12 9 6"></polyline></svg></a>`;
        }

        paginationContainer.innerHTML = html;

        // Re-attach click handlers
        paginationContainer.querySelectorAll('.page-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.preventDefault();
                const page = btn.getAttribute('data-page');
                const total = Math.ceil(getVisibleCards().length / ITEMS_PER_PAGE);

                if (page === 'next') {
                    if (currentPage < total) currentPage++;
                } else {
                    currentPage = parseInt(page, 10);
                }

                renderPagination();
                productsGrid.scrollIntoView({ behavior: 'smooth', block: 'start' });
            });
        });
    }

    // Initial render
    renderPagination();

    // Re-render when filter changes
    const filterBtns = document.querySelectorAll('.filter-btn[data-filter]');
    filterBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            currentPage = 1;
            // Wait for filter logic to update visibility
            setTimeout(renderPagination, 50);
        });
    });
}

// === PRODUCT CARD CAROUSELS ===
function initCarousels() {
    const carousels = document.querySelectorAll('.product-carousel');

    carousels.forEach(carousel => {
        const slides = carousel.querySelectorAll('.carousel-slide');
        const dots = carousel.querySelectorAll('.carousel-dots .dot');
        const prevBtn = carousel.querySelector('.carousel-prev');
        const nextBtn = carousel.querySelector('.carousel-next');
        const autoplay = carousel.getAttribute('data-autoplay') === 'true';
        const interval = parseInt(carousel.getAttribute('data-interval')) || 4000;

        if (slides.length <= 1) return;

        let currentIndex = 0;
        let timer = null;

        function goToSlide(index) {
            if (index < 0) index = slides.length - 1;
            if (index >= slides.length) index = 0;

            slides[currentIndex].classList.remove('active');
            if (dots[currentIndex]) dots[currentIndex].classList.remove('active');

            currentIndex = index;

            slides[currentIndex].classList.add('active');
            if (dots[currentIndex]) dots[currentIndex].classList.add('active');
        }

        function next() { goToSlide(currentIndex + 1); }
        function prev() { goToSlide(currentIndex - 1); }

        function startAutoplay() {
            if (autoplay) {
                timer = setInterval(next, interval);
            }
        }

        function stopAutoplay() {
            if (timer) {
                clearInterval(timer);
                timer = null;
            }
        }

        // Events
        if (prevBtn) prevBtn.addEventListener('click', (e) => { e.stopPropagation(); prev(); });
        if (nextBtn) nextBtn.addEventListener('click', (e) => { e.stopPropagation(); next(); });

        dots.forEach((dot, i) => {
            dot.addEventListener('click', (e) => { e.stopPropagation(); goToSlide(i); });
        });

        // Pause on hover
        carousel.addEventListener('mouseenter', stopAutoplay);
        carousel.addEventListener('mouseleave', startAutoplay);

        // Start
        startAutoplay();
    });
}

// === INITIALIZE ===
document.addEventListener('DOMContentLoaded', () => {
    loadAllComponents();
});
