import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterLink } from '@angular/router';
import { HeaderComponent } from '../../../shared/components/header/header.component';
import { FooterComponent } from '../../../shared/components/footer/footer.component';
import { CartService, CartItemDTO } from './services/cart.service';
import { ProductVariantService } from '../../product/services/product-variant.service';

@Component({
  selector: 'app-cart',
  standalone: true,
  imports: [CommonModule, RouterLink, HeaderComponent, FooterComponent],
  templateUrl: './cart.component.html',
  styleUrl: './cart.component.css',
})
export class CartComponent implements OnInit {
  isShoppingBagActive: boolean = true;
  isWishlistActive: boolean = false;
  cartItems: CartItemDTO[] = [];
  addedToWishlist: CartItemDTO | null = null;
  deletedProduct: CartItemDTO | null = null;
  currencyCode: string = 'EGP';
  isOutOfStock: boolean[]=[];
  productVariant: any;

  constructor(
    private router: Router,
    private cartService: CartService,
    private variantService: ProductVariantService,
  ) {}

  ngOnInit(): void {
    this.loadCartItems();
  }

  loadCartItems() {
    this.cartService.getCartItems().subscribe({
      next: (data) => {
        this.cartItems = data;

        this.isOutOfStock = Array(this.cartItems.length).fill(false);
      },
      error: (error) => {
        console.error('Error loading cart items:', error);
      }
    });
  }

  get totalAmount(): number {
    return this.cartItems.reduce(
      (total, item) => total + item.price * item.quantity,
      0
    );
  }

  addToCart(productVariantId: number,index: number=200) {
    const userId = '02e8635d-3a28-49ca-a084-180c12e3b7c3'; // Consider getting this from AuthService
    this.cartService.addCartItem(productVariantId).subscribe({
      next: (response) => {
         
        console.log(response);
        this.loadCartItems();
      },
      error: (error) => {
        if(error.status === 404) {
          this.isOutOfStock[index] = true;
          console.log('Product out of stock');
        }
      }
    });
  }

  removeFromCart(item: CartItemDTO) {
    this.cartService.removeOrDecreaseCartItem(item.id).subscribe({
      next: (response) => {
        console.log(response); // Log the success message
        const index = this.cartItems.findIndex(cartItem => cartItem.id === item.id);
        if (index > -1) {
          this.cartItems.splice(index, 1); // Remove the item from the cart array
          this.deletedProduct = { ...item }; // Set the deleted product
          setTimeout(() => {
            this.deletedProduct = null;
          }, 5500);
        }
      },
      error: (error) => {
        console.error('Error removing item from cart:', error);
      }
    });
  }

  addToWishlist(item: CartItemDTO) {
    this.cartService.moveToWishlist(item.id).subscribe({
      next: (response) => {
        console.log(response);
        const index = this.cartItems.findIndex(cartItem => cartItem.id === item.id);
        if (index > -1) {
          this.cartItems.splice(index, 1);
          this.addedToWishlist = { ...item };
          setTimeout(() => {
            this.addedToWishlist = null;
          }, 5500);
        }
      },
      error: (error) => {
        console.error('Error moving item to wishlist:', error);
      }
    });
  }

  onContinue() {
    console.log('Continue clicked');
  }

  increaseQuantity(item: CartItemDTO, index: number) {
    this.addToCart(item.productVariantId, index); // This will add one more of the same item
  }

  decreaseQuantity(item: CartItemDTO,index: number) {

    this.cartService.removeOrDecreaseCartItem(item.id).subscribe({
      next: (response) => {
        console.log(response); // Log the success message
        if (item.quantity > 1) {
          item.quantity--; // Decrease quantity on the UI
          this.isOutOfStock[index] = false;
        } else {
          const index = this.cartItems.findIndex(cartItem => cartItem.id === item.id);
          if (index > -1) {
            this.cartItems.splice(index, 1); // Remove the item if the quantity is 1
            this.deletedProduct = { ...item }; // Set the deleted product
            setTimeout(() => {
              this.deletedProduct = null;
            }, 5500);
          }
        }
      },
      error: (error) => {
        console.error('Error decreasing item quantity:', error);
      }
    });
  }

  get cartItemsCount(): number {
    return this.cartItems.reduce((count, item) => count + item.quantity, 0);
  }

  isCartEmpty(): boolean {
    return this.cartItems.length === 0;
  }

  undoDelete() {
    if (this.deletedProduct) {
      this.addToCart(this.deletedProduct.productVariantId);
      this.deletedProduct = null;
    }
  }

  toggleShoppingBag() {
    this.isShoppingBagActive = !this.isShoppingBagActive;
  }

  proceedToPayment() {
    // Calculate total price by summing up the price of each cart item
    const totalPrice = this.totalAmount;
  
    // Set cart items and total price in the service
    this.cartService.setCartItems(this.cartItems, totalPrice);
  
    // Navigate to the shipping method selection
    this.router.navigate(['/payment']);
  }

  navigateToProductDetails(item: CartItemDTO) {
    this.variantService.getVariantByVariantId(item.productVariantId)
      .subscribe({
        next: (productVariant: any) => {
          this.productVariant = productVariant;
          this.router.navigate([`products/${this.productVariant.productId}`]);
        }

      })
  }
}



interface Product {
  name: string;
  price: number;
  img: string;
  quantity: number;
  color: string;
  size: string;
}

