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

    // ===== ФОРМА ОТЗЫВА (С ПОДКЛЮЧЕНИЕМ К SUPABASE) =====
    const form = document.querySelector('.review-form');
    if(form) {
        form.addEventListener('submit', async function(e) {
            e.preventDefault();

            // ===== ПОДКЛЮЧЕНИЕ К SUPABASE =====
            const supabaseUrl = 'https://wrvovgkrrguvcvzeoyne.supabase.co';
            const supabaseKey = 'sb_publishable_oq8465obagmoA9k0pMmw_YPrq...'; // ← ВСТАВЬ СВОЙ ПОЛНЫЙ КЛЮЧ!
            const supabase = supabase.createClient(supabaseUrl, supabaseKey);
            // ===================================

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
                // Отправляем отзыв в базу данных (для товара с ID = 1)
                const { data, error } = await supabase
                    .rpc('add_review', {
                        p_product_id: 1,
                        p_user_name: name,
                        p_rating: activeStars,
                        p_review_text: text
                    });

                if (error) throw error;

                // Добавляем отзыв на страницу (визуально)
                const today = new Date();
                const date = `${today.getDate().toString().padStart(2, '0')}.${(today.getMonth() + 1).toString().padStart(2, '0')}.${today.getFullYear()}`;
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

                // Очищаем форму
                document.querySelector('.form-input').value = '';
                document.querySelector('.form-textarea').value = '';
                agreement.checked = false;
                document.querySelectorAll('.rating-input .star').forEach(s => s.classList.remove('active'));

                alert('Спасибо за ваш отзыв!');

            } catch (error) {
                console.error('Ошибка при отправке отзыва:', error);
                alert('Не удалось отправить отзыв. Попробуйте позже.');
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
});