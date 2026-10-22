// Magnetic Button Effect
        const magneticBtn = document.getElementById('magneticBtn');
        
        if (magneticBtn) {
            const magneticRadius = 100; // pixels
            
            document.addEventListener('mousemove', (e) => {
                const btnRect = magneticBtn.getBoundingClientRect();
                const btnCenterX = btnRect.left + btnRect.width / 2;
                const btnCenterY = btnRect.top + btnRect.height / 2;
                
                const distanceX = e.clientX - btnCenterX;
                const distanceY = e.clientY - btnCenterY;
                const distance = Math.sqrt(distanceX * distanceX + distanceY * distanceY);
                
                if (distance < magneticRadius) {
                    const pullStrength = (magneticRadius - distance) / magneticRadius;
                    const moveX = distanceX * pullStrength * 0.3;
                    const moveY = distanceY * pullStrength * 0.3;
                    
                    magneticBtn.style.transform = `translate(${moveX}px, ${moveY}px) scale(${1 + pullStrength * 0.1})`;
                } else {
                    magneticBtn.style.transform = 'translate(0, 0) scale(1)';
                }
            });
        }
        
        // Kinetic Title Effect - Responds to scroll with variable font weight
        const kineticTitle = document.querySelector('.kinetic-title');
        
        if (kineticTitle) {
            let lastScrollY = window.scrollY;
            let scrollVelocity = 0;
            
            window.addEventListener('scroll', () => {
                const scrollY = window.scrollY;
                scrollVelocity = Math.abs(scrollY - lastScrollY);
                
                // Variable font weight based on scroll speed (400 to 800)
                const minWeight = 400;
                const maxWeight = 800;
                const maxVelocity = 50;
                const weight = minWeight + (Math.min(scrollVelocity, maxVelocity) / maxVelocity) * (maxWeight - minWeight);
                
                kineticTitle.style.setProperty('--font-weight-kinetic', Math.round(weight));
                
                const delta = scrollY - lastScrollY;
                const rotation = Math.min(Math.max(delta * 0.1, -2), 2);
                
                kineticTitle.style.transform = `perspective(500px) rotateX(${rotation}deg)`;
                
                setTimeout(() => {
                    kineticTitle.style.transform = 'perspective(500px) rotateX(0deg)';
                }, 100);
                
                lastScrollY = scrollY;
            });
            
            // Mouse move parallax effect with glow
            document.addEventListener('mousemove', (e) => {
                const heroSection = document.querySelector('.hero-section');
                if (!heroSection) return;
                
                const rect = heroSection.getBoundingClientRect();
                if (e.clientY < rect.top || e.clientY > rect.bottom) return;
                
                const x = (e.clientX / window.innerWidth - 0.5) * 10;
                const y = (e.clientY / window.innerHeight - 0.5) * 10;
               
                kineticTitle.style.textShadow = `${x}px ${y}px 24px rgba(211, 47, 47, 0.4)`;
            });
        }
        
        // Enhanced Parallax effect on hero image with glow
        const heroImage = document.querySelector('.hero-image img');
        
        if (heroImage) {
            window.addEventListener('scroll', () => {
                const scrolled = window.scrollY;
                const rate = scrolled * 0.3;
                heroImage.style.transform = `translateY(${rate}px) scale(1.1)`;
            });
        }
        
        // Icon idle pulse animation
        const cardIcons = document.querySelectorAll('.card-icon');
        cardIcons.forEach(icon => {
            icon.classList.add('idle');
        });

        // Testimonial Carousel
        let currentSlide = 0;
        const slides = document.querySelectorAll('.testimonial-slide');
        const dotsContainer = document.getElementById('carouselDots');
        const counterEl = document.getElementById('carouselCounter');
        const progressBar = document.querySelector('.carousel-progress-bar');
        let autoSlideInterval;
        const SLIDE_DURATION = 6000;

        // Create dots
        if (slides.length && dotsContainer) {
            slides.forEach((_, i) => {
                const dot = document.createElement('span');
                dot.className = 'carousel-dot' + (i === 0 ? ' active' : '');
                dot.onclick = () => goToTestimonial(i);
                dotsContainer.appendChild(dot);
            });
            startAutoSlide();
        }

        function updateCounter() {
            if (counterEl) counterEl.textContent = `${currentSlide + 1} / ${slides.length}`;
        }

        function startProgress() {
            if (!progressBar) return;
            progressBar.style.transition = 'none';
            progressBar.style.width = '0%';
            // Force reflow
            progressBar.offsetWidth;
            progressBar.style.transition = `width ${SLIDE_DURATION}ms linear`;
            progressBar.style.width = '100%';
        }

        function goToTestimonial(index) {
            slides[currentSlide].classList.remove('active');
            if (dotsContainer.children[currentSlide]) dotsContainer.children[currentSlide].classList.remove('active');
            currentSlide = (index + slides.length) % slides.length;
            slides[currentSlide].classList.add('active');
            if (dotsContainer.children[currentSlide]) dotsContainer.children[currentSlide].classList.add('active');
            updateCounter();
            resetAutoSlide();
        }

        function changeTestimonial(dir) {
            goToTestimonial(currentSlide + dir);
        }

        function startAutoSlide() {
            startProgress();
            autoSlideInterval = setInterval(() => {
                goToTestimonial(currentSlide + 1);
            }, SLIDE_DURATION);
        }

        function resetAutoSlide() {
            clearInterval(autoSlideInterval);
            startAutoSlide();
        }

        // Pause on hover
        const carouselEl = document.querySelector('.testimonial-carousel');
        if (carouselEl) {
            carouselEl.addEventListener('mouseenter', () => {
                clearInterval(autoSlideInterval);
                if (progressBar) {
                    const computed = getComputedStyle(progressBar);
                    progressBar.style.transition = 'none';
                    progressBar.style.width = computed.width;
                }
            });
            carouselEl.addEventListener('mouseleave', () => {
                startAutoSlide();
            });
        }

        // Touch/swipe support
        let touchStartX = 0;
        let touchEndX = 0;
        const carouselInner = document.querySelector('.testimonial-carousel-inner');
        if (carouselInner) {
            carouselInner.addEventListener('touchstart', e => { touchStartX = e.changedTouches[0].screenX; }, {passive: true});
            carouselInner.addEventListener('touchend', e => {
                touchEndX = e.changedTouches[0].screenX;
                const diff = touchStartX - touchEndX;
                if (Math.abs(diff) > 50) changeTestimonial(diff > 0 ? 1 : -1);
            }, {passive: true});
        }

        // Floating parallax elements in Hero
        const floats = document.querySelectorAll('.hero-float');
        if (floats.length) {
            document.addEventListener('mousemove', (e) => {
                const heroSection = document.querySelector('.hero-section');
                if (!heroSection) return;
                const rect = heroSection.getBoundingClientRect();
                if (e.clientY < rect.top || e.clientY > rect.bottom) return;

                const cx = (e.clientX / window.innerWidth - 0.5);
                const cy = (e.clientY / window.innerHeight - 0.5);

                floats.forEach((el, i) => {
                    const depth = (i + 1) * 12;
                    const rx = cx * depth;
                    const ry = cy * depth;
                    el.style.transform = `translate(${rx}px, ${ry}px)`;
                });
            });
        }
window.changeTestimonial = changeTestimonial;
window.goToTestimonial = goToTestimonial;
