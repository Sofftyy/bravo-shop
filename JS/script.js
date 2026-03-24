// ============================================
// ПОЛНЫЙ КОД ДЛЯ КАТАЛОГА
// ============================================

// Данные товаров (можно заменить на данные из Supabase)
const products = [
    {
        id: 1,
        name: "Смартфон Galaxy X",
        price: 49990,
        shortDesc: "Мощный смартфон с отличной камерой",
        fullDesc: "Смартфон с 6.7-дюймовым экраном, тройной камерой 108 МП, процессором последнего поколения и аккумулятором 5000 мАч. Поддержка 5G, быстрая зарядка 65W.",
        specs: ["Экран: 6.7\" AMOLED", "Камера: 108 МП", "Память: 8/256 ГБ", "Батарея: 5000 мАч"],
        image: "https://via.placeholder.com/400x200?text=Смартфон"
    },
    {
        id: 2,
        name: "Ноутбук Pro 15",
        price: 79990,
        shortDesc: "Мощный ноутбук для работы и игр",
        fullDesc: "Ноутбук с 15.6-дюймовым дисплеем, процессором Intel Core i7, видеокартой RTX 3060, 16 ГБ оперативной памяти и SSD 512 ГБ. Идеален для работы с графикой и современных игр.",
        specs: ["Процессор: Intel Core i7", "Видеокарта: RTX 3060", "Память: 16 ГБ", "SSD: 512 ГБ"],
        image: "https://via.placeholder.com/400x200?text=Ноутбук"
    },
    {
        id: 3,
        name: "Наушники X Pro",
        price: 12990,
        shortDesc: "Беспроводные наушники с шумоподавлением",
        fullDesc: "Беспроводные наушники с активным шумоподавлением, временем работы до 30 часов, поддержкой быстрой зарядки и высококачественным звуком Hi-Res.",
        specs: ["Тип: Беспроводные", "Шумоподавление: Да", "Время работы: 30 ч", "Bluetooth 5.2"],
        image: "https://via.placeholder.com/400x200?text=Наушники"
    },
    {
        id: 4,
        name: "Умные часы Watch 5",
        price: 24990,
        shortDesc: "Стильные умные часы с GPS",
        fullDesc: "Умные часы с AMOLED-дисплеем, встроенным GPS, мониторингом сердечного ритма, отслеживанием сна и спортивных активностей. Защита от воды 5 ATM.",
        specs: ["Экран: AMOLED 1.4\"", "GPS: Да", "Защита: 5 ATM", "Аккумулятор: 3 дня"],
        image: "https://via.placeholder.com/400x200?text=Умные+часы"
    }
];

// Ждем полной загрузки страницы
document.addEventListener('DOMContentLoaded', function() {
    
    // === ОТРИСОВКА КАТАЛОГА ===
    renderCatalog();
    
    // === ФУНКЦИЯ БЕЗОПАСНОГО ПОИСКА ЭЛЕМЕНТОВ ===
    function safeQuerySelector(selector) {
        if (!selector || selector === '#' || selector === '' || selector === '#undefined' || selector === 'null') {
            console.warn('⚠️ Невалидный селектор:', selector);
            return null;
        }
        
        let cleanSelector = selector;
        
        // Если это просто ID без #
        if (!selector.startsWith('#') && !selector.startsWith('.') && !selector.includes('[') && !selector.includes(' ')) {
            cleanSelector = '#' + selector;
        }
        
        try {
            const element = document.querySelector(cleanSelector);
            if (!element) {
                console.warn('⚠️ Элемент не найден:', cleanSelector);
            }
            return element;
        } catch (error) {
            console.error('❌ Ошибка querySelector:', error.message, 'Селектор:', cleanSelector);
            return null;
        }
    }
    
    // === ФУНКЦИЯ ОТРИСОВКИ КАТАЛОГА ===
    function renderCatalog() {
        const catalogContainer = document.getElementById('catalog');
        if (!catalogContainer) {
            console.error('❌ Контейнер каталога не найден!');
            return;
        }
        
        // Генерируем HTML для всех товаров
        catalogContainer.innerHTML = products.map(product => `
            <div class="card" data-product-id="${product.id}">
                <img src="${product.image}" alt="${product.name}" class="card-image">
                <div class="card-content">
                    <h3 class="card-title">${product.name}</h3>
                    <div class="card-price">${product.price.toLocaleString()} ₽</div>
                    <p class="card-description">${product.shortDesc}</p>
                    <button class="detail-btn" data-id="${product.id}">Подробнее</button>
                    <div id="detail-${product.id}" class="detail-content">
                        <h4>📋 Полное описание</h4>
                        <p>${product.fullDesc}</p>
                        <h4>⚙️ Характеристики</h4>
                        <ul>
                            ${product.specs.map(spec => `<li>${spec}</li>`).join('')}
                        </ul>
                    </div>
                </div>
            </div>
        `).join('');
        
        // Инициализируем кнопки после отрисовки
        initDetailButtons();
    }
    
    // === ФУНКЦИЯ ИНИЦИАЛИЗАЦИИ КНОПОК ===
    function initDetailButtons() {
        // Находим все кнопки "Подробнее"
        const detailButtons = document.querySelectorAll('.detail-btn');
        
        if (detailButtons.length === 0) {
            console.warn('⚠️ Кнопки "Подробнее" не найдены');
            return;
        }
        
        console.log(`✅ Найдено кнопок: ${detailButtons.length}`);
        
        // Добавляем обработчик для каждой кнопки
        detailButtons.forEach(button => {
            // Удаляем старый обработчик, если есть
            button.removeEventListener('click', handleDetailClick);
            // Добавляем новый
            button.addEventListener('click', handleDetailClick);
        });
    }
    
    // === ОБРАБОТЧИК КЛИКА ПО КНОПКЕ "ПОДРОБНЕЕ" ===
    function handleDetailClick(event) {
        event.preventDefault();
        event.stopPropagation();
        
        const button = event.currentTarget;
        const productId = button.getAttribute('data-id');
        
        // Проверяем, что ID получен
        if (!productId) {
            console.error('❌ Не найден data-id у кнопки:', button);
            showNotification('Ошибка: идентификатор товара не найден', 'error');
            return;
        }
        
        // Находим элемент с детальным описанием
        const detailElement = safeQuerySelector(`detail-${productId}`);
        
        if (!detailElement) {
            console.error('❌ Элемент с деталями не найден для ID:', productId);
            showNotification('Информация о товаре временно недоступна', 'error');
            return;
        }
        
        // Переключаем видимость
        if (detailElement.classList.contains('show')) {
            // Скрываем
            detailElement.classList.remove('show');
            button.textContent = 'Подробнее';
            button.classList.remove('active');
        } else {
            // Показываем
            detailElement.classList.add('show');
            button.textContent = 'Скрыть';
            button.classList.add('active');
            
            // Плавно прокручиваем к деталям
            setTimeout(() => {
                detailElement.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
            }, 100);
        }
    }
    
    // === ФУНКЦИЯ ПОКАЗА УВЕДОМЛЕНИЙ ===
    function showNotification(message, type = 'info') {
        let container = document.querySelector('.notification-container');
        
        if (!container) {
            container = document.createElement('div');
            container.className = 'notification-container';
            document.body.appendChild(container);
        }
        
        const notification = document.createElement('div');
        notification.className = `notification ${type}`;
        
        // Иконка в зависимости от типа
        const icon = type === 'error' ? '❌' : type === 'success' ? '✅' : 'ℹ️';
        notification.innerHTML = `${icon} ${message}`;
        
        container.appendChild(notification);
        
        // Анимация исчезновения через 3 секунды
        setTimeout(() => {
            notification.style.animation = 'slideOut 0.3s ease';
            setTimeout(() => {
                notification.remove();
            }, 300);
        }, 3000);
        
        // Удаление по клику
        notification.onclick = () => {
            notification.style.animation = 'slideOut 0.3s ease';
            setTimeout(() => {
                notification.remove();
            }, 300);
        };
    }
    
    // === ФУНКЦИЯ ДЛЯ ОБНОВЛЕНИЯ КАТАЛОГА (если нужно добавить товары) ===
    window.updateCatalog = function(newProducts) {
        if (newProducts && Array.isArray(newProducts)) {
            products.push(...newProducts);
            renderCatalog();
            showNotification('Каталог обновлен', 'success');
        }
    };
    
    // === ФУНКЦИЯ ДЛЯ ЗАГРУЗКИ ДАННЫХ ИЗ SUPABASE ===
    window.loadFromSupabase = async function(supabaseClient, tableName = 'products') {
        if (!supabaseClient) {
            console.error('❌ Supabase клиент не передан');
            return;
        }
        
        try {
            const { data, error } = await supabaseClient
                .from(tableName)
                .select('*');
            
            if (error) throw error;
            
            if (data && data.length > 0) {
                // Очищаем текущий каталог и добавляем новые данные
                products.length = 0;
                data.forEach(item => {
                    products.push({
                        id: item.id,
                        name: item.name,
                        price: item.price,
                        shortDesc: item.short_description,
                        fullDesc: item.full_description,
                        specs: item.specs || [],
                        image: item.image_url || 'https://via.placeholder.com/400x200?text=Товар'
                    });
                });
                renderCatalog();
                showNotification('Данные загружены из Supabase', 'success');
            }
        } catch (error) {
            console.error('❌ Ошибка загрузки из Supabase:', error);
            showNotification('Ошибка загрузки данных', 'error');
        }
    };
    
    console.log('✅ Каталог инициализирован');
});