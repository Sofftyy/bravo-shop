document.addEventListener('DOMContentLoaded', function() {
    // ===== БУРГЕР-МЕНЮ =====
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

    // ===== ЗАГРУЗКА ОТЗЫВОВ ИЗ LOCALSTORAGE =====
    loadReviewsFromStorage();

    // ===== РЕЙТИНГ =====
    const stars = document.querySelectorAll('.rating-input .star');
    stars.forEach((star, index) => {
        star.addEventListener('click', function() {
            stars.forEach(s => s.classList.remove('active'));
            for(let i = 0; i <= index; i++) {
                stars[i].classList.add('active');
            }
        });
    });

    // ===== ФОРМА ОТЗЫВА (СОХРАНЕНИЕ В LOCALSTORAGE) =====
    const form = document.querySelector('.review-form');
    if(form) {
        form.addEventListener('submit', function(e) {
            e.preventDefault();
            
            const name = document.getElementById('reviewName').value.trim();
            const text = document.getElementById('reviewText').value.trim();
            const agreement = document.getElementById('agreement');
            const activeStars = document.querySelectorAll('.rating-input .star.active').length;
            
            if(!name || !text) {
                alert('Пожалуйста, заполните все поля!');
                return;
            }
            
            if(activeStars === 0) {
                alert('Пожалуйста, поставьте оценку!');
                return;
            }
            
            if(!agreement.checked) {
                alert('Необходимо согласие на обработку персональных данных');
                return;
            }
            
            // Сохраняем отзыв
            saveReviewToStorage(name, activeStars, text);
            
            // Добавляем отзыв на страницу
            addReviewToPage(name, activeStars, text);
            
            // Очищаем форму
            document.getElementById('reviewName').value = '';
            document.getElementById('reviewText').value = '';
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

// ===== ФУНКЦИЯ ЗАГРУЗКИ ОТЗЫВОВ ИЗ LOCALSTORAGE =====
function loadReviewsFromStorage() {
    const reviewsList = document.getElementById('reviewsList');
    if (!reviewsList) return;
    
    // Получаем отзывы из localStorage
    let reviews = JSON.parse(localStorage.getItem('bravo_reviews')) || [];
    
    // Если отзывов нет, добавляем тестовые
    if (reviews.length === 0) {
        reviews = [
            {
                name: 'Алексей',
                rating: 5,
                text: 'Уют и атмосфера в магазине на уровне! Одежда по качеству очень хороша.',
                date: '05.12.2025'
            },
            {
                name: 'Мария',
                rating: 4,
                text: 'Хорошая куртка, но немного великовата',
                date: '10.12.2025'
            },
            {
                name: 'Елена',
                rating: 5,
                text: 'Платье просто супер! Все подруги спрашивают где купила',
                date: '15.12.2025'
            }
        ];
        localStorage.setItem('bravo_reviews', JSON.stringify(reviews));
    }
    
    // Отображаем отзывы
    reviewsList.innerHTML = '';
    
    reviews.forEach(review => {
        const starsHtml = '★'.repeat(review.rating) + '☆'.repeat(5 - review.rating);
        
        const reviewCard = document.createElement('div');
        reviewCard.className = 'review-card';
        reviewCard.innerHTML = `
            <div class="review-header">
                <span class="review-author">${escapeHtml(review.name)}</span>
                <span class="review-date">${escapeHtml(review.date)}</span>
            </div>
            <div class="review-rating">
                ${starsHtml.split('').map(s => `<span class="star">${s}</span>`).join('')}
            </div>
            <p class="review-text">${escapeHtml(review.text)}</p>
        `;
        
        reviewsList.appendChild(reviewCard);
    });
}

// ===== ФУНКЦИЯ СОХРАНЕНИЯ ОТЗЫВА В LOCALSTORAGE =====
function saveReviewToStorage(name, rating, text) {
    let reviews = JSON.parse(localStorage.getItem('bravo_reviews')) || [];
    
    const today = new Date();
    const date = `${today.getDate().toString().padStart(2, '0')}.${(today.getMonth() + 1).toString().padStart(2, '0')}.${today.getFullYear()}`;
    
    const newReview = {
        name: escapeHtml(name),
        rating: rating,
        text: escapeHtml(text),
        date: date
    };
    
    reviews.unshift(newReview);
    
    // Ограничиваем количество отзывов до 50
    if (reviews.length > 50) reviews = reviews.slice(0, 50);
    
    localStorage.setItem('bravo_reviews', JSON.stringify(reviews));
}

// ===== ФУНКЦИЯ ДОБАВЛЕНИЯ ОТЗЫВА НА СТРАНИЦУ =====
function addReviewToPage(name, rating, text) {
    const today = new Date();
    const date = `${today.getDate().toString().padStart(2, '0')}.${(today.getMonth() + 1).toString().padStart(2, '0')}.${today.getFullYear()}`;
    
    const starsHtml = '★'.repeat(rating) + '☆'.repeat(5 - rating);
    
    const reviewsList = document.getElementById('reviewsList');
    const newReview = document.createElement('div');
    newReview.className = 'review-card';
    newReview.innerHTML = `
        <div class="review-header">
            <span class="review-author">${escapeHtml(name)}</span>
            <span class="review-date">${date}</span>
        </div>
        <div class="review-rating">
            ${starsHtml.split('').map(s => `<span class="star">${s}</span>`).join('')}
        </div>
        <p class="review-text">${escapeHtml(text)}</p>
    `;
    
    reviewsList.prepend(newReview);
}

function escapeHtml(str) {
    if (!str) return '';
    return str
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#39;');
}