// Cart initialization and shared functions
document.addEventListener('DOMContentLoaded', function() {
    // Initialize cart state
    window.cartState = {
        items: [],
        total: 0,
        count: window.cartCount || 0
    };

    // Initialize dropdowns
    setupCartDropdowns();

    // Load initial cart data
    loadCartData();
});

// Setup cart dropdowns
function setupCartDropdowns() {
    // Make sure Bootstrap is loaded
    if (typeof bootstrap === 'undefined') {
        console.error('Bootstrap is not loaded');
        return;
    }

    // Find cart dropdown elements
    const cartButtons = document.querySelectorAll('.nav-icon.dropdown-toggle');
    
    cartButtons.forEach(button => {
        // Remove existing click listeners
        button.replaceWith(button.cloneNode(true));
        const newButton = document.querySelector('.nav-icon.dropdown-toggle');
        
        // Add click handler
        newButton.addEventListener('click', function(e) {
            e.preventDefault();
            e.stopPropagation();
            
            const dropdownMenu = this.nextElementSibling;
            const isOpen = dropdownMenu.classList.contains('show');
            
            // Close all dropdowns first
            document.querySelectorAll('.dropdown-menu.show').forEach(menu => {
                menu.classList.remove('show');
            });
            
            // Toggle current dropdown
            if (!isOpen) {
                dropdownMenu.classList.add('show');
            }
        });
    });

    // Close dropdown when clicking outside
    document.addEventListener('click', function(e) {
        if (!e.target.closest('.dropdown')) {
            document.querySelectorAll('.dropdown-menu.show').forEach(menu => {
                menu.classList.remove('show');
            });
        }
    });
}

// Load cart data
async function loadCartData() {
    if (!window.user) return;

    try {
        const response = await fetch('/cart', {
            headers: {
                'X-Requested-With': 'XMLHttpRequest',
                'Accept': 'application/json'
            }
        });
        const data = await response.json();
        if (data.success) {
            window.updateCartDisplay(data.cart);
        }
    } catch (error) {
        console.error('Error loading cart:', error);
    }
}

// Update cart display function
window.updateCartDisplay = function(cart) {
    const cartItemsContainer = document.querySelector('.cart-items');
    const cartTotal = document.querySelector('.cart-total');
    const cartCount = document.querySelector('.cart-count');

    if (!cartItemsContainer) return;

    // Update cart state
    window.cartState = {
        items: cart?.items || [],
        total: cart?.total || 0,
        count: cart?.items?.length || 0
    };

    // Update cart display
    if (!cart?.items?.length) {
        cartItemsContainer.innerHTML = `
            <p class="text-muted text-center py-3">Your cart is empty</p>
        `;
        if (cartTotal) cartTotal.textContent = '$0.00';
        if (cartCount) {
            cartCount.style.display = 'none';
            cartCount.textContent = '0';
        }
        return;
    }

    // Update cart items
    let cartHTML = '';
    cart.items.forEach(item => {
        if (item?.product) {
            cartHTML += `
                <div class="cart-item d-flex align-items-center p-2 border-bottom">
                    <img src="${item.product.images?.[0]?.url || '/images/default.jpg'}"
                         alt="${item.product.name || 'Product'}"
                         class="me-2"
                         style="width: 50px; height: 50px; object-fit: cover;">
                    <div class="flex-grow-1">
                        <h6 class="mb-0">${item.product.name || 'Product'}</h6>
                        <small class="text-muted">
                            ${item.quantity} × $${(item.product.price || 0).toFixed(2)}
                        </small>
                    </div>
                    <button onclick="window.removeFromCart('${item._id}')"
                            class="btn btn-sm btn-link text-danger">
                        <i class="bi bi-x"></i>
                    </button>
                </div>
            `;
        }
    });

    cartItemsContainer.innerHTML = cartHTML;

    // Add cart summary
    if (cart.items.length > 0) {
        cartItemsContainer.innerHTML += `
            <div class="dropdown-divider"></div>
            <div class="d-flex justify-content-between align-items-center mb-2">
                <span>Total:</span>
                <strong>$${(cart.total || 0).toFixed(2)}</strong>
            </div>
            <div class="d-grid gap-2">
                <a href="/cart" class="btn btn-primary">View Cart</a>
                <a href="/checkout" class="btn btn-success">Checkout</a>
            </div>
        `;
    }

    // Update cart count badge
    if (cartCount) {
        cartCount.textContent = cart.items.length;
        cartCount.style.display = cart.items.length > 0 ? 'block' : 'none';
    }
};

// Remove from cart function
window.removeFromCart = async function(productId) {
    try {
        console.log('Attempting to remove product:', productId);

        if (!productId || productId.length !== 24) {
            throw new Error('Invalid product ID');
        }

        const response = await fetch(`/cart/remove/${productId}`, {
            method: 'DELETE',
            headers: {
                'Content-Type': 'application/json',
                'X-Requested-With': 'XMLHttpRequest',
                'Accept': 'application/json'
            }
        });

        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.error || `HTTP error! status: ${response.status}`);
        }

        const data = await response.json();
        console.log('Server response:', data);

        if (data.success) {
            console.log('Updating cart display with:', data.cart);
            window.updateCartDisplay(data.cart);
            window.showAlert('Item removed from cart', 'success');
            
            if (window.location.pathname === '/cart') {
                setTimeout(() => {
                    window.location.reload();
                }, 500);
            }
        } else {
            throw new Error(data.error || 'Error removing item');
        }
    } catch (error) {
        console.error('Error removing item:', error);
        window.showAlert(error.message || 'Error removing item from cart', 'danger');
    }
};

// Alert function
window.showAlert = function(message, type = 'success') {
    const alertDiv = document.createElement('div');
    alertDiv.className = `alert alert-${type} alert-dismissible fade show position-fixed top-0 start-50 translate-middle-x mt-3`;
    alertDiv.style.zIndex = '1050';
    alertDiv.innerHTML = `
        ${message}
        <button type="button" class="btn-close" data-bs-dismiss="alert" aria-label="Close"></button>
    `;
    document.body.appendChild(alertDiv);

    setTimeout(() => {
        alertDiv.remove();
    }, 3000);
};

// Update quantity function
async function updateQuantity(itemId, newQuantity) {
    try {
        const response = await fetch('/cart/update', {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
                'Accept': 'application/json'
            },
            body: JSON.stringify({
                itemId,
                quantity: newQuantity
            })
        });

        const data = await response.json();

        if (!response.ok) {
            throw new Error(data.error || 'Error updating quantity');
        }

        if (data.success) {
            window.updateCartDisplay(data.cart);
        } else {
            throw new Error(data.error);
        }
    } catch (error) {
        console.error('Error:', error);
        window.showAlert(error.message, 'danger');
    }
}

// Add checkout validation
async function validateCheckout() {
    try {
        const response = await fetch('/cart/validate', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Accept': 'application/json'
            }
        });

        const data = await response.json();

        if (!response.ok) {
            if (data.stockErrors) {
                const errorMessages = data.stockErrors
                    .map(error => error.message)
                    .join('\n');
                throw new Error(errorMessages);
            }
            throw new Error(data.error || 'Error validating cart');
        }

        // If validation passes, proceed to checkout
        window.location.href = '/checkout';

    } catch (error) {
        console.error('Validation error:', error);
        window.showAlert(error.message, 'danger');
    }
} 