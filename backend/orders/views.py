from rest_framework import status, permissions
from rest_framework.decorators import api_view, permission_classes
from rest_framework.response import Response
from django.shortcuts import get_object_or_404
from django.db import transaction
from django.db.models import Q
from .models import Order, OrderItem, Cart, CartItem
from products.models import Product
from .serializers import (
    OrderSerializer, OrderCreateSerializer, CartSerializer, 
    AddToCartSerializer, UpdateCartItemSerializer
)

# Cart Views
@api_view(['GET'])
def get_cart(request):
    """Get user's cart"""
    cart, created = Cart.objects.get_or_create(user=request.user)
    serializer = CartSerializer(cart)
    return Response(serializer.data)

@api_view(['POST'])
def add_to_cart(request):
    """Add item to cart"""
    serializer = AddToCartSerializer(data=request.data)
    if serializer.is_valid():
        product_id = serializer.validated_data['product_id']
        quantity = serializer.validated_data['quantity']
        
        try:
            product = Product.objects.get(id=product_id, is_active=True)
        except Product.DoesNotExist:
            return Response({'error': 'Product not found'}, 
                          status=status.HTTP_404_NOT_FOUND)
        
        if product.stock < quantity:
            return Response({'error': 'Insufficient stock'}, 
                          status=status.HTTP_400_BAD_REQUEST)
        
        cart, created = Cart.objects.get_or_create(user=request.user)
        cart_item, created = CartItem.objects.get_or_create(
            cart=cart, 
            product=product,
            defaults={'quantity': quantity}
        )
        
        if not created:
            new_quantity = cart_item.quantity + quantity
            if product.stock < new_quantity:
                return Response({'error': 'Insufficient stock'}, 
                              status=status.HTTP_400_BAD_REQUEST)
            cart_item.quantity = new_quantity
            cart_item.save()
        
        return Response({'message': 'Item added to cart successfully'}, 
                       status=status.HTTP_201_CREATED)
    
    return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

@api_view(['PUT'])
def update_cart_item(request, item_id):
    """Update cart item quantity"""
    serializer = UpdateCartItemSerializer(data=request.data)
    if serializer.is_valid():
        quantity = serializer.validated_data['quantity']
        
        try:
            cart_item = CartItem.objects.get(
                id=item_id, 
                cart__user=request.user
            )
        except CartItem.DoesNotExist:
            return Response({'error': 'Cart item not found'}, 
                          status=status.HTTP_404_NOT_FOUND)
        
        if cart_item.product.stock < quantity:
            return Response({'error': 'Insufficient stock'}, 
                          status=status.HTTP_400_BAD_REQUEST)
        
        cart_item.quantity = quantity
        cart_item.save()
        
        return Response({'message': 'Cart item updated successfully'})
    
    return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

@api_view(['DELETE'])
def remove_from_cart(request, item_id):
    """Remove item from cart"""
    try:
        cart_item = CartItem.objects.get(
            id=item_id, 
            cart__user=request.user
        )
        cart_item.delete()
        return Response({'message': 'Item removed from cart'}, 
                       status=status.HTTP_204_NO_CONTENT)
    except CartItem.DoesNotExist:
        return Response({'error': 'Cart item not found'}, 
                       status=status.HTTP_404_NOT_FOUND)

@api_view(['DELETE'])
def clear_cart(request):
    """Clear all items from cart"""
    try:
        cart = Cart.objects.get(user=request.user)
        cart.items.all().delete()
        return Response({'message': 'Cart cleared successfully'}, 
                       status=status.HTTP_204_NO_CONTENT)
    except Cart.DoesNotExist:
        return Response({'message': 'Cart is already empty'})

# Order Views
@api_view(['POST'])
def create_order(request):
    """Create order from cart"""
    serializer = OrderCreateSerializer(data=request.data)
    if serializer.is_valid():
        try:
            cart = Cart.objects.get(user=request.user)
            if not cart.items.exists():
                return Response({'error': 'Cart is empty'}, 
                              status=status.HTTP_400_BAD_REQUEST)
            
            with transaction.atomic():
                # Check stock availability
                for cart_item in cart.items.all():
                    if cart_item.product.stock < cart_item.quantity:
                        return Response({
                            'error': f'Insufficient stock for {cart_item.product.name}'
                        }, status=status.HTTP_400_BAD_REQUEST)
                
                # Create order
                order = Order.objects.create(
                    buyer=request.user,
                    total_amount=cart.total_amount,
                    shipping_address=serializer.validated_data['shipping_address']
                )
                
                # Create order items and update stock
                for cart_item in cart.items.all():
                    OrderItem.objects.create(
                        order=order,
                        product=cart_item.product,
                        quantity=cart_item.quantity,
                        price_at_time=cart_item.product.price
                    )
                    
                    # Update product stock
                    cart_item.product.stock -= cart_item.quantity
                    cart_item.product.save()
                
                # Clear cart
                cart.items.all().delete()
                
                response_serializer = OrderSerializer(order)
                return Response(response_serializer.data, 
                              status=status.HTTP_201_CREATED)
                
        except Cart.DoesNotExist:
            return Response({'error': 'Cart not found'}, 
                          status=status.HTTP_404_NOT_FOUND)
    
    return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

@api_view(['GET'])
def buyer_orders(request):
    """Get buyer's orders"""
    orders = Order.objects.filter(buyer=request.user).order_by('-created_at')
    serializer = OrderSerializer(orders, many=True)
    return Response(serializer.data)

@api_view(['GET'])
def seller_orders(request):
    """Get seller's orders (only orders containing their products)"""
    if not request.user.is_seller:
        return Response({'error': 'Only sellers can access this endpoint'}, 
                       status=status.HTTP_403_FORBIDDEN)
    
    # Get orders that contain the seller's products
    orders = Order.objects.filter(
        items__product__seller=request.user
    ).distinct().order_by('-created_at')
    
    # Filter order items to show only seller's products
    serialized_orders = []
    for order in orders:
        order_data = OrderSerializer(order).data
        # Filter items to show only this seller's products
        order_data['items'] = [
            item for item in order_data['items'] 
            if item['seller_name'] == request.user.full_name
        ]
        serialized_orders.append(order_data)
    
    return Response(serialized_orders)

@api_view(['GET'])
def order_detail(request, pk):
    """Get order details"""
    try:
        order = Order.objects.get(pk=pk)
        
        # Check permissions
        if request.user == order.buyer:
            # Buyer can see their own order
            serializer = OrderSerializer(order)
            return Response(serializer.data)
        elif request.user.is_seller and order.items.filter(product__seller=request.user).exists():
            # Seller can see orders containing their products
            order_data = OrderSerializer(order).data
            # Filter items to show only this seller's products
            order_data['items'] = [
                item for item in order_data['items'] 
                if item['seller_name'] == request.user.full_name
            ]
            return Response(order_data)
        else:
            return Response({'error': 'Permission denied'}, 
                          status=status.HTTP_403_FORBIDDEN)
            
    except Order.DoesNotExist:
        return Response({'error': 'Order not found'}, 
                       status=status.HTTP_404_NOT_FOUND)

@api_view(['PUT'])
def update_order_status(request, pk):
    """Update order status (sellers only for their products)"""
    if not request.user.is_seller:
        return Response({'error': 'Only sellers can update order status'}, 
                       status=status.HTTP_403_FORBIDDEN)
    
    try:
        order = Order.objects.get(pk=pk)
        
        # Check if seller has products in this order
        if not order.items.filter(product__seller=request.user).exists():
            return Response({'error': 'Permission denied'}, 
                          status=status.HTTP_403_FORBIDDEN)
        
        new_status = request.data.get('status')
        if new_status not in dict(Order.STATUS_CHOICES):
            return Response({'error': 'Invalid status'}, 
                          status=status.HTTP_400_BAD_REQUEST)
        
        order.status = new_status
        order.save()
        
        serializer = OrderSerializer(order)
        return Response(serializer.data)
        
    except Order.DoesNotExist:
        return Response({'error': 'Order not found'}, 
                       status=status.HTTP_404_NOT_FOUND)