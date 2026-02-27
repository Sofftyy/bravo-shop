document.addEventListener('DOMContentLoaded', function() {
    // ===== МЕНЮ =====
    const burgerMenu = document.getElementById('burgerMenu');
    const navMenu = document.getElementById('navMenu');
    
    if (burgerMenu && navMenu) {
        burgerMenu.addEventListener('click', function() {
            burgerMenu.classList.toggle('active');
            navMenu.classList.toggle('active');
        });
        
        const menuLinks = navMenu.querySelectorAll('a');
        menuLinks.forEach(link => {
            link.addEventListener('click', function() {
                burgerMenu.classList.remove('active');
                navMenu.classList.remove('active');
            });
        });
    }

    // ===== ПЕРЕКЛЮЧЕНИЕ ТОВАРОВ =====
    const catalogGrid = document.getElementById('catalogGrid');
    const prevArrow = document.querySelector('.prev-arrow');
    const nextArrow = document.querySelector('.next-arrow');
    
    if (catalogGrid && prevArrow && nextArrow) {
        const products = Array.from(catalogGrid.children);
        
        function swapProducts() {
            const firstProduct = products[0];
            const secondProduct = products[1];
            
            catalogGrid.innerHTML = '';
            catalogGrid.appendChild(secondProduct);
            catalogGrid.appendChild(firstProduct);
            
            products.reverse();
        }
        
        prevArrow.addEventListener('click', swapProducts);
        nextArrow.addEventListener('click', swapProducts);
    }

    // ===== РЕЙТИНГ  =====
    const stars = document.querySelectorAll('.rating-input .star');
    stars.forEach((star, index) => {
        star.addEventListener('click', function() {
            stars.forEach(s => s.classList.remove('active'));
            for(let i = 0; i <= index; i++) {
                stars[i].classList.add('active');
            }
        });
    });

    // ===== ФОРМА ОТЗЫВА =====
    const form = document.querySelector('.review-form');
    if(form) {
        form.addEventListener('submit', function(e) {
            e.preventDefault();
            
            const name = document.querySelector('.form-input').value.trim();
            const text = document.querySelector('.form-textarea').value.trim();
            const agreement = document.getElementById('agreement');
            
            if(!name || !text) {
                alert('Пожалуйста, заполните все поля!');
                return;
            }
            
            if(!agreement.checked) {
                alert('Необходимо согласие на обработку персональных данных');
                return;
            }
            
            const today = new Date();
            const date = `${today.getDate().toString().padStart(2, '0')}.${(today.getMonth() + 1).toString().padStart(2, '0')}.${today.getFullYear()}`;
            
            const activeStars = document.querySelectorAll('.rating-input .star.active').length;
            const starsHtml = '★'.repeat(activeStars) + '☆'.repeat(5 - activeStars);
            
            const reviewsList = document.querySelector('.reviews-list');
            const newReview = document.createElement('div');
            newReview.className = 'review-card';
            newReview.innerHTML = `
                <div class="review-header">
                    <span class="review-author">${name}</span>
                    <span class="review-date">${date}</span>
                </div>
                <div class="review-rating">
                    ${starsHtml.split('').map(s => `<span class="star">${s}</span>`).join('')}
                </div>
                <p class="review-text">${text}</p>
            `;
            
            reviewsList.prepend(newReview);
            
            document.querySelector('.form-input').value = '';
            document.querySelector('.form-textarea').value = '';
            agreement.checked = false;
            stars.forEach(s => s.classList.remove('active'));
            
            alert('Спасибо за ваш отзыв!');
        });
    }

    // ===== ПЛАВНАЯ ПРОКРУТКА =====
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function(e) {
            e.preventDefault();
            const target = document.querySelector(this.getAttribute('href'));
            if(target) {
                target.scrollIntoView({
                    behavior: 'smooth',
                    block: 'start'
                });
            }
        });
    });
});