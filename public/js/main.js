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