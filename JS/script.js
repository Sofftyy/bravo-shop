// Конфигурация Supabase - ЗАМЕНИ НА СВОИ ДАННЫЕ!
const SUPABASE_URL = 'https://твой-проект.supabase.co';
const SUPABASE_ANON_KEY = 'твой-anon-key';

// Инициализация Supabase
const supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// Переменная для хранения выбранных фото
let selectedPhotos = [];

document.addEventListener('DOMContentLoaded', function() {
    console.log('Сайт загружен, инициализация...');
    
    initBurgerMenu();
    initProductSlider();
    loadReviewsFromSupabase(); // Загружаем из БД
    initRatingStars();
    initReviewForm();
    initSmoothScroll();
    initPhotoUpload();
    
    console.log('Все компоненты инициализированы');
});

function initBurgerMenu() {
    const burgerMenu = document.getElementById('burgerMenu');
    const navMenu = document.getElementById('navMenu');
    
    if (burgerMenu && navMenu) {
        burgerMenu.addEventListener('click', function() {
            burgerMenu.classList.toggle('active');
            navMenu.classList.toggle('active');
        });
        
        const menuLinks = navMenu.querySelectorAll('a');
        menuLinks.forEach(link => {
            link.addEventListener('click', () => {
                burgerMenu.classList.remove('active');
                navMenu.classList.remove('active');
            });
        });
    }
}

function initProductSlider() {
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
}

function initRatingStars() {
    const stars = document.querySelectorAll('.rating-input .star');
    stars.forEach((star, index) => {
        star.addEventListener('click', function() {
            stars.forEach(s => s.classList.remove('active'));
            for(let i = 0; i <= index; i++) {
                stars[i].classList.add('active');
            }
        });
    });
}

// Загрузка отзывов из Supabase
async function loadReviewsFromSupabase() {
    const reviewsList = document.getElementById('reviewsList');
    if (!reviewsList) return;
    
    reviewsList.innerHTML = '<div style="text-align: center; padding: 20px;">Загрузка отзывов...</div>';
    
    try {
        const { data, error } = await supabase
            .from('reviews')
            .select(`
                id,
                user_name,
                rating,
                review_text,
                review_date,
                created_at
            `)
            .order('created_at', { ascending: false })
            .limit(20);
        
        if (error) throw error;
        
        if (!data || data.length === 0) {
            reviewsList.innerHTML = '<div style="text-align: center; padding: 20px;">Пока нет отзывов. Будьте первым!</div>';
            return;
        }
        
        reviewsList.innerHTML = '';
        
        data.forEach(review => {
            const starsHtml = '★'.repeat(review.rating) + '☆'.repeat(5 - review.rating);
            
            // Форматируем дату
            let date = review.review_date || review.created_at;
            if (date) {
                const d = new Date(date);
                date = `${d.getDate().toString().padStart(2, '0')}.${(d.getMonth() + 1).toString().padStart(2, '0')}.${d.getFullYear()}`;
            } else {
                date = 'Дата неизвестна';
            }
            
            const reviewCard = document.createElement('div');
            reviewCard.className = 'review-card';
            reviewCard.innerHTML = `
                <div class="review-header">
                    <span class="review-author">${escapeHtml(review.user_name)}</span>
                    <span class="review-date">${date}</span>
                </div>
                <div class="review-rating">
                    ${starsHtml.split('').map(s => `<span class="star">${s}</span>`).join('')}
                </div>
                <p class="review-text">${escapeHtml(review.review_text)}</p>
            `;
            reviewsList.appendChild(reviewCard);
        });
        
    } catch (error) {
        console.error('Ошибка загрузки отзывов:', error);
        reviewsList.innerHTML = '<div style="text-align: center; padding: 20px;">Ошибка загрузки отзывов</div>';
    }
}

// Добавление отзыва в Supabase
async function addReviewToSupabase(name, rating, text) {
    try {
        const { data, error } = await supabase
            .from('reviews')
            .insert([
                {
                    user_name: name,
                    rating: rating,
                    review_text: text,
                    product_id: 1
                }
            ])
            .select();
        
        if (error) throw error;
        
        return { success: true, data: data[0] };
    } catch (error) {
        console.error('Ошибка добавления отзыва:', error);
        return { success: false, error: error.message };
    }
}

function initReviewForm() {
    const form = document.querySelector('.review-form');
    if(!form) return;
    
    form.addEventListener('submit', async function(e) {
        e.preventDefault();
        
        const name = document.getElementById('reviewName')?.value.trim();
        const text = document.getElementById('reviewText')?.value.trim();
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
        
        if(!agreement?.checked) {
            alert('Необходимо согласие на обработку персональных данных');
            return;
        }
        
        const submitBtn = form.querySelector('.btn-submit');
        submitBtn.disabled = true;
        submitBtn.textContent = 'Отправка...';
        
        const result = await addReviewToSupabase(name, activeStars, text);
        
        if (result.success) {
            await loadReviewsFromSupabase();
            
            document.getElementById('reviewName').value = '';
            document.getElementById('reviewText').value = '';
            agreement.checked = false;
            document.querySelectorAll('.rating-input .star').forEach(s => s.classList.remove('active'));
            selectedPhotos = [];
            updatePhotoUploadDisplay();
            
            alert('Спасибо за ваш отзыв!');
        } else {
            alert('Ошибка при сохранении: ' + result.error);
        }
        
        submitBtn.disabled = false;
        submitBtn.textContent = 'Отправить';
    });
}

function initSmoothScroll() {
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function(e) {
            e.preventDefault();
            const target = document.querySelector(this.getAttribute('href'));
            if(target) {
                target.scrollIntoView({ behavior: 'smooth', block: 'start' });
            }
        });
    });
}

function initPhotoUpload() {
    const photoUploadBtn = document.getElementById('photoUploadBtn');
    const photoInput = document.getElementById('photoInput');
    
    if (photoUploadBtn && photoInput) {
        photoUploadBtn.addEventListener('click', function(e) {
            e.preventDefault();
            photoInput.click();
        });
        
        photoInput.addEventListener('change', function(e) {
            const files = Array.from(e.target.files);
            const newFiles = files.slice(0, 3 - selectedPhotos.length);
            
            if (newFiles.length < files.length) {
                alert('Можно загрузить не более 3 фото');
            }
            
            selectedPhotos = [...selectedPhotos, ...newFiles];
            updatePhotoUploadDisplay();
            
            photoInput.value = '';
        });
    }
}

function updatePhotoUploadDisplay() {
    const photoUploadBtn = document.getElementById('photoUploadBtn');
    if (!photoUploadBtn) return;
    
    const photoLabel = photoUploadBtn.querySelector('.photo-label');
    const photoNote = photoUploadBtn.querySelector('.photo-note');
    
    if (selectedPhotos.length > 0) {
        photoLabel.textContent = `Выбрано ${selectedPhotos.length} фото`;
        photoNote.textContent = selectedPhotos.map(f => f.name.substring(0, 20)).join(', ');
        photoUploadBtn.style.backgroundColor = '#e8f0fe';
    } else {
        photoLabel.textContent = 'Добавить фото';
        photoNote.textContent = 'до 3 изображений';
        photoUploadBtn.style.backgroundColor = '';
    }
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