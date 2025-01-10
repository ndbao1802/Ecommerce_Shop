// Add to cart functionality
function addToCart(productId) {
    // Implement cart functionality
}

// Search functionality
document.querySelector('.search-form').addEventListener('submit', function(e) {
    e.preventDefault();
    // Implement search functionality
});

// Initialize tooltips
var tooltipTriggerList = [].slice.call(document.querySelectorAll('[data-bs-toggle="tooltip"]'))
var tooltipList = tooltipTriggerList.map(function (tooltipTriggerEl) {
    return new bootstrap.Tooltip(tooltipTriggerEl)
}); 

// Initialize dropdowns
document.addEventListener('DOMContentLoaded', function() {
    var dropdowns = document.querySelectorAll('.dropdown-toggle');
    dropdowns.forEach(function(dropdown) {
        new bootstrap.Dropdown(dropdown);
    });

    // Handle hover events for desktop
    if (window.matchMedia('(min-width: 992px)').matches) {
        document.querySelectorAll('.dropdown').forEach(function(dropdown) {
            dropdown.addEventListener('mouseenter', function() {
                bootstrap.Dropdown.getOrCreateInstance(this.querySelector('.dropdown-toggle')).show();
            });
            
            dropdown.addEventListener('mouseleave', function() {
                bootstrap.Dropdown.getOrCreateInstance(this.querySelector('.dropdown-toggle')).hide();
            });
        });
    }
}); 