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

    // ===== НАСТРОЙКИ SUPABASE (вынесли отдельно) =====
    const SUPABASE_URL = 'https://wrvovgkrrguvcvzeoyne.supabase.co';
    const SUPABASE_KEY = 'sb_publishable_oq84G50obqgmOAj60kUPmw_YPrq-DpT'; 

    // ===== ФУНКЦИЯ ЗАГРУЗКИ ОТЗЫВОВ =====
    async function loadReviews() {
        try {
            // СОЗДАЁМ КЛИЕНТ ПРЯМО ЗДЕСЬ
            const supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_KEY);
            
            const { data: reviews, error } = await supabase
                .from('v_recent_reviews')
                .select('*')
                .limit(20);

            if (error) throw error;

            const reviewsList = document.querySelector('.reviews-list');
            
            if (reviews && reviews.length > 0) {
                reviewsList.innerHTML = '';
                
                reviews.forEach(review => {
                    const reviewCard = document.createElement('div');
                    reviewCard.className = 'review-card';
                    
                    const reviewDate = review.review_date 
                        ? new Date(review.review_date).toLocaleDateString('ru-RU')
                        : 'Дата не указана';
                    
                    const starsHtml = '★'.repeat(review.rating) + '☆'.repeat(5 - review.rating);
                    
                    reviewCard.innerHTML = `
                        <div class="review-header">
                            <span class="review-author">${review.user_name}</span>
                            <span class="review-date">${reviewDate}</span>
                        </div>
                        <div class="review-rating">
                            ${starsHtml.split('').map(s => `<span class="star">${s}</span>`).join('')}
                        </div>
                        <p class="review-text">${review.review_text}</p>
                        <div class="review-product">Товар: ${review.product_name}</div>
                    `;
                    
                    reviewsList.appendChild(reviewCard);
                });
            } else {
                reviewsList.innerHTML = '<p class="no-reviews">Пока нет отзывов. Будьте первым!</p>';
            }
        } catch (error) {
            console.error('Ошибка при загрузке отзывов:', error);
            document.querySelector('.reviews-list').innerHTML = '<p class="no-reviews">Не удалось загрузить отзывы</p>';
        }
    }

    // ===== ФОРМА ОТЗЫВА =====
    const form = document.querySelector('.review-form');
    if(form) {
        form.addEventListener('submit', async function(e) {
            e.preventDefault();

            // СОЗДАЁМ КЛИЕНТ ПРЯМО ЗДЕСЬ
            const supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_KEY);

            const name = document.querySelector('.form-input').value.trim();
            const text = document.querySelector('.form-textarea').value.trim();
            const agreement = document.getElementById('agreement');
            const activeStars = document.querySelectorAll('.rating-input .star.active').length;

            if(!name || !text) {
                alert('Пожалуйста, заполните все поля!');
                return;
            }
            if(!agreement.checked) {
                alert('Необходимо согласие на обработку персональных данных');
                return;
            }

            try {
                const { data, error } = await supabase
                    .rpc('add_review', {
                        p_product_id: 1,
                        p_user_name: name,
                        p_rating: activeStars,
                        p_review_text: text
                    });

                if (error) throw error;

                // Очищаем форму
                document.querySelector('.form-input').value = '';
                document.querySelector('.form-textarea').value = '';
                agreement.checked = false;
                document.querySelectorAll('.rating-input .star').forEach(s => s.classList.remove('active'));

                alert('✅ Отзыв успешно добавлен! Спасибо!');
                
                // Перезагружаем отзывы
                loadReviews();

            } catch (error) {
                console.error('Ошибка при отправке отзыва:', error);
                alert('❌ Ошибка: ' + error.message);
            }
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

    // ===== ЗАГРУЖАЕМ ОТЗЫВЫ ПРИ СТАРТЕ =====
    loadReviews();
});