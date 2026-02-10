// Expense Manager - Enhanced JavaScript Functionality

document.addEventListener('DOMContentLoaded', function() {
    // Set today's date as default in the date input
    const dateInput = document.getElementById('date');
    if (dateInput && !dateInput.value) {
        const today = new Date().toISOString().split('T')[0];
        dateInput.value = today;
    }

    // Restore last selected values from localStorage
    restoreFormValues();

    // Save form values when they change and update categories
    const typeSelect = document.getElementById('type');
    const categoryHiddenInput = document.getElementById('category');
    
    if (typeSelect) {
        typeSelect.addEventListener('change', function() {
            localStorage.setItem('lastType', this.value);
            updateCategoryOptions(this.value);
        });
        
        // Initialize categories on page load
        updateCategoryOptions(typeSelect.value);
    }
    
    // Initialize searchable category dropdown
    initSearchableCategory();
    
    // Initialize edit modal category dropdown
    initEditSearchableCategory();

    // Add form validation
    const form = document.querySelector('form[action="/add"]');
    if (form) {
        form.addEventListener('submit', function(e) {
            const amount = document.getElementById('amount').value;
            const date = document.getElementById('date').value;
            
            if (!amount || parseFloat(amount) <= 0) {
                e.preventDefault();
                showNotification('אנא הזן סכום חיובי', 'error');
                return false;
            }
            
            if (!date) {
                e.preventDefault();
                showNotification('אנא בחר תאריך', 'error');
                return false;
            }
        });
    }

    // Confirm before delete
    const deleteLinks = document.querySelectorAll('.delete-btn');
    deleteLinks.forEach(link => {
        link.addEventListener('click', function(e) {
            if (!confirm('האם אתה בטוח שברצונך למחוק תנועה זו?')) {
                e.preventDefault();
                return false;
            }
        });
    });

    // Add smooth scroll to top button
    createScrollToTopButton();

    // Save form values before submit
    if (form) {
        form.addEventListener('submit', function() {
            const type = document.getElementById('type').value;
            const category = document.getElementById('category').value;
            localStorage.setItem('lastType', type);
            localStorage.setItem('lastCategory', category);
        });
    }

    // Add keyboard shortcuts
    document.addEventListener('keydown', function(e) {
        // Ctrl/Cmd + N for new transaction (focus on type field)
        if ((e.ctrlKey || e.metaKey) && e.key === 'n') {
            e.preventDefault();
            const typeField = document.getElementById('type');
            if (typeField) {
                typeField.focus();
                typeField.scrollIntoView({ behavior: 'smooth', block: 'center' });
            }
        }
        // Escape to close modal
        if (e.key === 'Escape') {
            closeEditModal();
        }
    });

    // Add animation to cards on scroll
    observeElements();

    // Add table sorting functionality
    initTableSorting();
    
    // Initialize theme toggle
    initThemeToggle();
    
    // Initialize filtering
    initFiltering();
    
    // Load available periods for filtering
    loadAvailablePeriods();
});

// Restore form values from localStorage
function restoreFormValues() {
    const lastType = localStorage.getItem('lastType');
    
    const typeSelect = document.getElementById('type');
    
    if (lastType && typeSelect) {
        typeSelect.value = lastType;
    }
    
    // Category will be restored by updateCategoryOptions function
}

// Show notification
function showNotification(message, type = 'success') {
    // Remove existing notification if any
    const existing = document.querySelector('.notification');
    if (existing) {
        existing.remove();
    }

    // Create notification element
    const notification = document.createElement('div');
    notification.className = `notification ${type} show`;
    notification.textContent = message;
    
    document.body.appendChild(notification);

    // Auto-hide after 3 seconds
    setTimeout(() => {
        notification.classList.remove('show');
        setTimeout(() => notification.remove(), 300);
    }, 3000);
}

// Create scroll to top button
function createScrollToTopButton() {
    const button = document.createElement('button');
    button.innerHTML = '⬆️';
    button.className = 'scroll-to-top';
    button.style.cssText = `
        position: fixed;
        bottom: 30px;
        left: 30px;
        background: linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%);
        color: white;
        border: 1px solid rgba(129, 140, 248, 0.3);
        border-radius: 50%;
        width: 50px;
        height: 50px;
        font-size: 1.5rem;
        cursor: pointer;
        opacity: 0;
        visibility: hidden;
        transition: all 0.3s ease;
        box-shadow: 0 8px 25px rgba(99, 102, 241, 0.4);
        z-index: 1000;
        backdrop-filter: blur(10px);
    `;

    document.body.appendChild(button);

    // Show/hide button based on scroll position
    window.addEventListener('scroll', () => {
        if (window.pageYOffset > 300) {
            button.style.opacity = '1';
            button.style.visibility = 'visible';
        } else {
            button.style.opacity = '0';
            button.style.visibility = 'hidden';
        }
    });

    // Hover effect
    button.addEventListener('mouseenter', () => {
        button.style.transform = 'translateY(-5px) scale(1.1)';
        button.style.boxShadow = '0 12px 35px rgba(99, 102, 241, 0.6)';
    });

    button.addEventListener('mouseleave', () => {
        button.style.transform = 'translateY(0) scale(1)';
        button.style.boxShadow = '0 8px 25px rgba(99, 102, 241, 0.4)';
    });

    // Scroll to top on click
    button.addEventListener('click', () => {
        window.scrollTo({
            top: 0,
            behavior: 'smooth'
        });
    });
}

// Observe elements for animation
function observeElements() {
    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.style.opacity = '1';
                entry.target.style.transform = 'translateY(0)';
            }
        });
    }, {
        threshold: 0.1
    });

    // Observe all cards and sections
    const elements = document.querySelectorAll('.card, .form-section, .transactions-section, .chart-container');
    elements.forEach(el => {
        el.style.opacity = '0';
        el.style.transform = 'translateY(20px)';
        el.style.transition = 'opacity 0.5s ease, transform 0.5s ease';
        observer.observe(el);
    });
}

// Format currency
function formatCurrency(amount) {
    return new Intl.NumberFormat('he-IL', {
        style: 'currency',
        currency: 'ILS'
    }).format(amount);
}

// Calculate percentage
function calculatePercentage(part, total) {
    if (total === 0) return 0;
    return ((part / total) * 100).toFixed(1);
}

// Category data - merged and sorted alphabetically in Hebrew
const CATEGORIES = {
    'Expense': [
        'אחזקת רכב ותיקונים',
        'אינטרנט',
        'ארנונה',
        'ביגוד והנעלה',
        'ביה"ס וחומרי לימוד',
        'ביטוח (חובה ומקיף)',
        'גן עיריה',
        'גנים פרטיים',
        'דלק',
        'הוצאות אשראי נוספות',
        'הזמנות אוכל',
        'וועד בית',
        'חבילת גלישה טלפון',
        'חוגים',
        'חשמל',
        'טלפון סלולרי',
        'טסט',
        'כבלים/יס',
        'כל הביטוחים',
        'מזומן ללא מעקב',
        'מזון ומכולת',
        'מנוי פיס',
        'מסעדות',
        'מספרה',
        'משכנתא',
        'נטפליקס, דיסני',
        'ספורט',
        'קניות',
        'שכירות',
        'תחבורה ציבורית',
        'אחר'
    ],
    'Income': [
        'החזר',
        'השקעות',
        'הכנסה אחרת',
        'מתנה',
        'משכורת',
        'פרילנס'
    ].sort((a, b) => a.localeCompare(b, 'he'))
};

// Initialize searchable category dropdown
function initSearchableCategory() {
    const searchInput = document.getElementById('category-search');
    const dropdown = document.getElementById('category-dropdown');
    const hiddenInput = document.getElementById('category');
    
    if (!searchInput || !dropdown || !hiddenInput) return;
    
    // Show dropdown on focus
    searchInput.addEventListener('focus', function() {
        dropdown.classList.add('show');
    });
    
    // Filter options on input
    searchInput.addEventListener('input', function() {
        const searchTerm = this.value.trim();
        filterCategories(searchTerm);
    });
    
    // Hide dropdown when clicking outside
    document.addEventListener('click', function(e) {
        if (!searchInput.contains(e.target) && !dropdown.contains(e.target)) {
            dropdown.classList.remove('show');
        }
    });
    
    // Prevent form submission on Enter in search input
    searchInput.addEventListener('keydown', function(e) {
        if (e.key === 'Enter') {
            e.preventDefault();
            // Select first visible option
            const firstVisible = dropdown.querySelector('.category-option:not(.hidden)');
            if (firstVisible) {
                selectCategory(firstVisible.textContent);
            }
        }
    });
}

// Update category options based on transaction type
function updateCategoryOptions(type) {
    const dropdown = document.getElementById('category-dropdown');
    const searchInput = document.getElementById('category-search');
    const hiddenInput = document.getElementById('category');
    
    if (!dropdown) return;
    
    // Get categories for the selected type
    const categories = CATEGORIES[type] || CATEGORIES['Expense'];
    
    // Save current selection
    const currentValue = hiddenInput ? hiddenInput.value : '';
    
    // Clear dropdown
    dropdown.innerHTML = '';
    
    // Add category options
    categories.forEach(category => {
        const option = document.createElement('div');
        option.className = 'category-option';
        option.textContent = category;
        option.dataset.value = category;
        
        // Add click handler
        option.addEventListener('click', function() {
            selectCategory(category);
        });
        
        dropdown.appendChild(option);
    });
    
    // Try to restore previous selection
    if (categories.includes(currentValue)) {
        selectCategory(currentValue);
    } else {
        // Try localStorage
        const lastCategory = localStorage.getItem('lastCategory');
        if (lastCategory && categories.includes(lastCategory)) {
            selectCategory(lastCategory);
        } else if (categories.length > 0) {
            // Select first category as default
            selectCategory(categories[0]);
        }
    }
}

// Select a category
function selectCategory(category) {
    const searchInput = document.getElementById('category-search');
    const dropdown = document.getElementById('category-dropdown');
    const hiddenInput = document.getElementById('category');
    
    if (!searchInput || !hiddenInput) return;
    
    // Update inputs
    searchInput.value = category;
    hiddenInput.value = category;
    
    // Update selected state in dropdown
    const options = dropdown.querySelectorAll('.category-option');
    options.forEach(opt => {
        if (opt.textContent === category) {
            opt.classList.add('selected');
        } else {
            opt.classList.remove('selected');
        }
    });
    
    // Hide dropdown
    dropdown.classList.remove('show');
    
    // Save to localStorage
    localStorage.setItem('lastCategory', category);
}

// Filter categories based on search term
function filterCategories(searchTerm) {
    const dropdown = document.getElementById('category-dropdown');
    if (!dropdown) return;
    
    const options = dropdown.querySelectorAll('.category-option');
    const lowerSearch = searchTerm.toLowerCase();
    
    options.forEach(option => {
        const text = option.textContent.toLowerCase();
        if (text.includes(lowerSearch)) {
            option.classList.remove('hidden');
        } else {
            option.classList.add('hidden');
        }
    });
}

// Initialize table sorting
function initTableSorting() {
    const table = document.querySelector('table');
    if (!table) return;

    const headers = table.querySelectorAll('th.sortable');
    let currentSort = { column: 'date', direction: 'desc' }; // Default sort

    // Update export form fields with current sort
    function updateExportSort() {
        const sortColumnInput = document.getElementById('export-sort-column');
        const sortDirectionInput = document.getElementById('export-sort-direction');
        if (sortColumnInput) sortColumnInput.value = currentSort.column;
        if (sortDirectionInput) sortDirectionInput.value = currentSort.direction;
    }

    // Initialize export form with default sort
    updateExportSort();

    headers.forEach(header => {
        header.addEventListener('click', function() {
            const column = this.dataset.column;
            const tbody = table.querySelector('tbody');
            const rows = Array.from(tbody.querySelectorAll('tr'));

            // Determine sort direction
            if (currentSort.column === column) {
                currentSort.direction = currentSort.direction === 'asc' ? 'desc' : 'asc';
            } else {
                currentSort.direction = 'asc';
            }
            currentSort.column = column;

            // Update export form fields
            updateExportSort();

            // Remove sort classes from all headers
            headers.forEach(h => {
                h.classList.remove('asc', 'desc');
            });

            // Add sort class to current header
            this.classList.add(currentSort.direction);

            // Sort rows based on column
            rows.sort((a, b) => {
                let aValue, bValue;

                switch(column) {
                    case 'type':
                        // Get the type from the last cell (index 4)
                        aValue = a.cells[4].textContent.trim();
                        bValue = b.cells[4].textContent.trim();
                        break;
                    case 'category':
                        aValue = a.cells[3].textContent.trim();
                        bValue = b.cells[3].textContent.trim();
                        break;
                    case 'amount':
                        // Extract numeric value from amount
                        aValue = parseFloat(a.cells[2].textContent.replace(/[^\d.-]/g, ''));
                        bValue = parseFloat(b.cells[2].textContent.replace(/[^\d.-]/g, ''));
                        break;
                    case 'date':
                        aValue = a.cells[1].textContent.trim();
                        bValue = b.cells[1].textContent.trim();
                        break;
                    default:
                        return 0;
                }

                // Compare values
                let comparison = 0;
                if (typeof aValue === 'number' && typeof bValue === 'number') {
                    comparison = aValue - bValue;
                } else {
                    comparison = String(aValue).localeCompare(String(bValue), 'he');
                }

                return currentSort.direction === 'asc' ? comparison : -comparison;
            });

            // Re-append sorted rows
            rows.forEach(row => tbody.appendChild(row));
        });
    });
}

// ==========================================
// EDIT MODAL FUNCTIONALITY
// ==========================================

// Initialize edit modal category dropdown
function initEditSearchableCategory() {
    const searchInput = document.getElementById('edit-category-search');
    const dropdown = document.getElementById('edit-category-dropdown');
    const hiddenInput = document.getElementById('edit-category');
    
    if (!searchInput || !dropdown || !hiddenInput) return;
    
    // Show dropdown on focus
    searchInput.addEventListener('focus', function() {
        dropdown.classList.add('show');
    });
    
    // Filter options on input
    searchInput.addEventListener('input', function() {
        const searchTerm = this.value.trim();
        filterEditCategories(searchTerm);
    });
    
    // Hide dropdown when clicking outside
    document.addEventListener('click', function(e) {
        if (!searchInput.contains(e.target) && !dropdown.contains(e.target)) {
            dropdown.classList.remove('show');
        }
    });
    
    // Prevent form submission on Enter in search input
    searchInput.addEventListener('keydown', function(e) {
        if (e.key === 'Enter') {
            e.preventDefault();
            const firstVisible = dropdown.querySelector('.category-option:not(.hidden)');
            if (firstVisible) {
                selectEditCategory(firstVisible.textContent);
            }
        }
    });
}

// Update edit modal category options based on transaction type
function updateEditCategoryOptions(type, selectedCategory = null) {
    const dropdown = document.getElementById('edit-category-dropdown');
    const searchInput = document.getElementById('edit-category-search');
    const hiddenInput = document.getElementById('edit-category');
    
    if (!dropdown) return;
    
    const categories = CATEGORIES[type] || CATEGORIES['Expense'];
    
    dropdown.innerHTML = '';
    
    categories.forEach(category => {
        const option = document.createElement('div');
        option.className = 'category-option';
        option.textContent = category;
        option.dataset.value = category;
        
        option.addEventListener('click', function() {
            selectEditCategory(category);
        });
        
        dropdown.appendChild(option);
    });
    
    if (selectedCategory && categories.includes(selectedCategory)) {
        selectEditCategory(selectedCategory);
    } else if (categories.length > 0) {
        selectEditCategory(categories[0]);
    }
}

// Select a category in edit modal
function selectEditCategory(category) {
    const searchInput = document.getElementById('edit-category-search');
    const dropdown = document.getElementById('edit-category-dropdown');
    const hiddenInput = document.getElementById('edit-category');
    
    if (!searchInput || !hiddenInput) return;
    
    searchInput.value = category;
    hiddenInput.value = category;
    
    const options = dropdown.querySelectorAll('.category-option');
    options.forEach(opt => {
        if (opt.textContent === category) {
            opt.classList.add('selected');
        } else {
            opt.classList.remove('selected');
        }
    });
    
    dropdown.classList.remove('show');
}

// Filter edit categories based on search term
function filterEditCategories(searchTerm) {
    const dropdown = document.getElementById('edit-category-dropdown');
    if (!dropdown) return;
    
    const options = dropdown.querySelectorAll('.category-option');
    const lowerSearch = searchTerm.toLowerCase();
    
    options.forEach(option => {
        const text = option.textContent.toLowerCase();
        if (text.includes(lowerSearch)) {
            option.classList.remove('hidden');
        } else {
            option.classList.add('hidden');
        }
    });
}

// Open edit modal and load transaction data
function openEditModal(transactionId) {
    const modal = document.getElementById('edit-modal');
    const form = document.getElementById('edit-form');
    
    if (!modal || !form) return;
    
    // Fetch transaction data
    fetch(`/get/${transactionId}`)
        .then(response => response.json())
        .then(data => {
            if (data.error) {
                showNotification('שגיאה בטעינת הנתונים', 'error');
                return;
            }
            
            // Set form action
            form.action = `/edit/${transactionId}`;
            
            // Populate form fields
            document.getElementById('edit-type').value = data.type;
            document.getElementById('edit-amount').value = data.amount;
            document.getElementById('edit-date').value = data.date;
            
            // Update categories for the type and select the current category
            updateEditCategoryOptions(data.type, data.category);
            
            // Add change listener for type to update categories
            const typeSelect = document.getElementById('edit-type');
            typeSelect.onchange = function() {
                updateEditCategoryOptions(this.value);
            };
            
            // Show modal
            modal.style.display = 'flex';
            document.body.style.overflow = 'hidden';
        })
        .catch(error => {
            console.error('Error fetching transaction:', error);
            showNotification('שגיאה בטעינת הנתונים', 'error');
        });
}

// Close edit modal
function closeEditModal() {
    const modal = document.getElementById('edit-modal');
    if (modal) {
        modal.style.display = 'none';
        document.body.style.overflow = '';
    }
}

// Close modal when clicking outside
document.addEventListener('click', function(e) {
    const modal = document.getElementById('edit-modal');
    if (e.target === modal) {
        closeEditModal();
    }
});

// ==========================================
// THEME TOGGLE FUNCTIONALITY
// ==========================================

function initThemeToggle() {
    const themeToggle = document.getElementById('theme-toggle');
    if (!themeToggle) return;
    
    // Check for saved theme preference
    const savedTheme = localStorage.getItem('theme') || 'dark';
    applyTheme(savedTheme);
    
    themeToggle.addEventListener('click', function() {
        const currentTheme = document.body.classList.contains('light-theme') ? 'light' : 'dark';
        const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
        applyTheme(newTheme);
        localStorage.setItem('theme', newTheme);
    });
}

function applyTheme(theme) {
    const themeIcon = document.querySelector('.theme-icon');
    
    if (theme === 'light') {
        document.body.classList.add('light-theme');
        if (themeIcon) themeIcon.textContent = '☀️';
    } else {
        document.body.classList.remove('light-theme');
        if (themeIcon) themeIcon.textContent = '🌙';
    }
}

// ==========================================
// FILTERING FUNCTIONALITY
// ==========================================

function initFiltering() {
    const applyFilterBtn = document.getElementById('apply-filter');
    const clearFilterBtn = document.getElementById('clear-filter');
    const filterPeriod = document.getElementById('filter-period');
    
    if (applyFilterBtn) {
        applyFilterBtn.addEventListener('click', applyFilters);
    }
    
    if (clearFilterBtn) {
        clearFilterBtn.addEventListener('click', clearFilters);
    }
    
    if (filterPeriod) {
        filterPeriod.addEventListener('change', function() {
            const customMonthGroup = document.getElementById('custom-month-group');
            const customYearGroup = document.getElementById('custom-year-group');
            
            // Hide both custom selectors first
            if (customMonthGroup) customMonthGroup.style.display = 'none';
            if (customYearGroup) customYearGroup.style.display = 'none';
            
            // Show the appropriate one
            if (this.value === 'custom-month' && customMonthGroup) {
                customMonthGroup.style.display = 'block';
            } else if (this.value === 'custom-year' && customYearGroup) {
                customYearGroup.style.display = 'block';
            }
        });
    }
    
    // Allow Enter key to apply filters in search field
    const filterSearch = document.getElementById('filter-search');
    if (filterSearch) {
        filterSearch.addEventListener('keydown', function(e) {
            if (e.key === 'Enter') {
                e.preventDefault();
                applyFilters();
            }
        });
    }
}

function loadAvailablePeriods() {
    fetch('/api/available-periods')
        .then(response => response.json())
        .then(data => {
            const monthSelect = document.getElementById('filter-custom-month');
            const yearSelect = document.getElementById('filter-custom-year');
            
            if (monthSelect && data.months) {
                monthSelect.innerHTML = '';
                data.months.forEach(month => {
                    const option = document.createElement('option');
                    option.value = month;
                    // Format month for display (YYYY-MM to MM/YYYY)
                    const [year, monthNum] = month.split('-');
                    const monthNames = ['ינואר', 'פברואר', 'מרץ', 'אפריל', 'מאי', 'יוני',
                                       'יולי', 'אוגוסט', 'ספטמבר', 'אוקטובר', 'נובמבר', 'דצמבר'];
                    option.textContent = `${monthNames[parseInt(monthNum) - 1]} ${year}`;
                    monthSelect.appendChild(option);
                });
            }
            
            if (yearSelect && data.years) {
                yearSelect.innerHTML = '';
                data.years.forEach(year => {
                    const option = document.createElement('option');
                    option.value = year;
                    option.textContent = year;
                    yearSelect.appendChild(option);
                });
            }
        })
        .catch(error => {
            console.error('Error loading periods:', error);
        });
}

function applyFilters() {
    const searchTerm = document.getElementById('filter-search')?.value || '';
    const filterType = document.getElementById('filter-type')?.value || '';
    const filterPeriod = document.getElementById('filter-period')?.value || '';
    
    let month = '';
    let year = '';
    
    // Determine the period filter
    if (filterPeriod === 'month') {
        const now = new Date();
        month = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
    } else if (filterPeriod === 'year') {
        year = new Date().getFullYear().toString();
    } else if (filterPeriod === 'custom-month') {
        month = document.getElementById('filter-custom-month')?.value || '';
    } else if (filterPeriod === 'custom-year') {
        year = document.getElementById('filter-custom-year')?.value || '';
    }
    
    // Build query string
    const params = new URLSearchParams();
    if (searchTerm) params.append('search', searchTerm);
    if (filterType) params.append('type', filterType);
    if (month) params.append('month', month);
    if (year) params.append('year', year);
    
    // Fetch filtered data
    fetch(`/api/transactions?${params.toString()}`)
        .then(response => response.json())
        .then(data => {
            if (data.error) {
                showNotification('שגיאה בסינון הנתונים', 'error');
                return;
            }
            
            updateTableWithFilteredData(data);
            updateDashboardCards(data);
            
            // Update charts with filtered data
            if (typeof window.updateCharts === 'function') {
                window.updateCharts(data);
            }
            
            showNotification(`נמצאו ${data.transactions.length} תנועות`, 'success');
        })
        .catch(error => {
            console.error('Error applying filters:', error);
            showNotification('שגיאה בסינון הנתונים', 'error');
        });
}

function clearFilters() {
    // Reset all filter inputs
    const filterSearch = document.getElementById('filter-search');
    const filterType = document.getElementById('filter-type');
    const filterPeriod = document.getElementById('filter-period');
    const customMonthGroup = document.getElementById('custom-month-group');
    const customYearGroup = document.getElementById('custom-year-group');
    
    if (filterSearch) filterSearch.value = '';
    if (filterType) filterType.value = '';
    if (filterPeriod) filterPeriod.value = '';
    if (customMonthGroup) customMonthGroup.style.display = 'none';
    if (customYearGroup) customYearGroup.style.display = 'none';
    
    // Reload page to show all data
    window.location.reload();
}

function updateTableWithFilteredData(data) {
    const tbody = document.querySelector('table tbody');
    if (!tbody) return;
    
    tbody.innerHTML = '';
    
    if (data.transactions.length === 0) {
        const row = document.createElement('tr');
        row.innerHTML = '<td colspan="5" style="text-align: center; padding: 30px; color: #94a3b8;">לא נמצאו תנועות התואמות לסינון</td>';
        tbody.appendChild(row);
        return;
    }
    
    data.transactions.forEach(transaction => {
        const row = document.createElement('tr');
        row.className = `transaction-${transaction.type === 'Income' ? 'income' : 'expense'}`;
        row.dataset.id = transaction.id;
        
        const typeDisplay = transaction.type === 'Income'
            ? '<span style="color: #10b981; font-weight: 600;">📈 הכנסה</span>'
            : '<span style="color: #ef4444; font-weight: 600;">📉 הוצאה</span>';
        
        const amountClass = transaction.type === 'Income' ? 'amount-income' : 'amount-expense';
        
        row.innerHTML = `
            <td class="actions-cell">
                <button type="button" class="edit-btn" onclick="openEditModal(${transaction.id})">✏️ ערוך</button>
                <a href="/delete/${transaction.id}" class="delete-btn" onclick="return confirm('האם אתה בטוח שברצונך למחוק תנועה זו?')">🗑️ מחק</a>
            </td>
            <td data-date="${transaction.date}">${transaction.date}</td>
            <td class="${amountClass}" data-amount="${transaction.amount}">${formatNumber(transaction.amount)} ₪</td>
            <td data-category="${transaction.category}">${transaction.category}</td>
            <td data-type="${transaction.type}">${typeDisplay}</td>
        `;
        
        tbody.appendChild(row);
    });
    
    // Update balance in footer
    const balanceCell = document.querySelector('tfoot .balance-amount');
    if (balanceCell) {
        balanceCell.textContent = `${formatNumber(data.balance)} ₪`;
        balanceCell.className = `balance-amount ${data.balance >= 0 ? 'balance-positive' : 'balance-negative'}`;
    }
}

function updateDashboardCards(data) {
    // Update income card
    const incomeAmount = document.querySelector('.card.income .amount');
    if (incomeAmount) {
        incomeAmount.textContent = `${formatNumber(data.total_income)} ₪`;
    }
    
    // Update expense card
    const expenseAmount = document.querySelector('.card.expense .amount');
    if (expenseAmount) {
        expenseAmount.textContent = `${formatNumber(data.total_expenses)} ₪`;
    }
    
    // Update balance card
    const balanceCard = document.querySelector('.card.balance, .card.balance-positive, .card.balance-negative');
    if (balanceCard) {
        const balanceAmount = balanceCard.querySelector('.amount');
        if (balanceAmount) {
            balanceAmount.textContent = `${formatNumber(data.balance)} ₪`;
        }
        
        // Update balance card class
        balanceCard.classList.remove('balance-positive', 'balance-negative');
        balanceCard.classList.add(data.balance >= 0 ? 'balance-positive' : 'balance-negative');
    }
}

function formatNumber(num) {
    return new Intl.NumberFormat('he-IL', {
        minimumFractionDigits: 0,
        maximumFractionDigits: 2
    }).format(num);
}

// ==========================================
// EXPORT FUNCTIONS
// ==========================================

// Export functions for potential future use
window.ExpenseManager = {
    showNotification,
    formatCurrency,
    calculatePercentage,
    openEditModal,
    closeEditModal,
    applyFilters,
    clearFilters
};

// Make functions globally available
window.openEditModal = openEditModal;
window.closeEditModal = closeEditModal;
