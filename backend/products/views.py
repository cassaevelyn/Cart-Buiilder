from rest_framework import status, permissions
from rest_framework.decorators import api_view, permission_classes
from rest_framework.response import Response
from rest_framework.pagination import PageNumberPagination
from django.db.models import Q
from django.shortcuts import get_object_or_404
from .models import Product
from .serializers import ProductSerializer, ProductCreateUpdateSerializer, ProductListSerializer

class ProductPagination(PageNumberPagination):
    page_size = 50
    page_size_query_param = 'page_size'
    max_page_size = 100

@api_view(['GET'])
@permission_classes([permissions.AllowAny])
def product_list(request):
    """List all active products with search and filtering"""
    products = Product.objects.filter(is_active=True).select_related('seller')
    
    # Search functionality
    search = request.GET.get('search', '')
    if search:
        products = products.filter(
            Q(name__icontains=search) | 
            Q(description__icontains=search) |
            Q(seller__first_name__icontains=search) |
            Q(seller__last_name__icontains=search)
        )
    
    # Price filtering
    min_price = request.GET.get('min_price')
    max_price = request.GET.get('max_price')
    if min_price:
        products = products.filter(price__gte=min_price)
    if max_price:
        products = products.filter(price__lte=max_price)
    
    # Store filtering
    store = request.GET.get('store')
    if store:
        products = products.filter(
            Q(seller__first_name__icontains=store) |
            Q(seller__last_name__icontains=store)
        )
    
    # In stock filtering
    in_stock = request.GET.get('in_stock')
    if in_stock and in_stock.lower() == 'true':
        products = products.filter(stock__gt=0)
    
    # Sorting
    sort_by = request.GET.get('sort', '-created_at')
    if sort_by in ['price', '-price', 'name', '-name', 'created_at', '-created_at']:
        products = products.order_by(sort_by)
    
    paginator = ProductPagination()
    paginated_products = paginator.paginate_queryset(products, request)
    serializer = ProductListSerializer(paginated_products, many=True)
    
    return paginator.get_paginated_response(serializer.data)

@api_view(['GET'])
@permission_classes([permissions.AllowAny])
def product_detail(request, pk):
    """Get single product details"""
    product = get_object_or_404(Product, pk=pk, is_active=True)
    serializer = ProductSerializer(product)
    return Response(serializer.data)

@api_view(['GET'])
def seller_products(request):
    """Get seller's own products"""
    if not request.user.is_seller:
        return Response({'error': 'Only sellers can access this endpoint'}, 
                       status=status.HTTP_403_FORBIDDEN)
    
    products = Product.objects.filter(seller=request.user).order_by('-created_at')
    serializer = ProductSerializer(products, many=True)
    return Response(serializer.data)

@api_view(['POST'])
def create_product(request):
    """Create new product (sellers only)"""
    if not request.user.is_seller:
        return Response({'error': 'Only sellers can create products'}, 
                       status=status.HTTP_403_FORBIDDEN)
    
    serializer = ProductCreateUpdateSerializer(data=request.data)
    if serializer.is_valid():
        product = serializer.save(seller=request.user)
        response_serializer = ProductSerializer(product)
        return Response(response_serializer.data, status=status.HTTP_201_CREATED)
    
    return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

@api_view(['PUT'])
def update_product(request, pk):
    """Update product (sellers only, own products)"""
    if not request.user.is_seller:
        return Response({'error': 'Only sellers can update products'}, 
                       status=status.HTTP_403_FORBIDDEN)
    
    product = get_object_or_404(Product, pk=pk, seller=request.user)
    serializer = ProductCreateUpdateSerializer(product, data=request.data, partial=True)
    
    if serializer.is_valid():
        product = serializer.save()
        response_serializer = ProductSerializer(product)
        return Response(response_serializer.data)
    
    return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

@api_view(['DELETE'])
def delete_product(request, pk):
    """Delete product (sellers only, own products)"""
    if not request.user.is_seller:
        return Response({'error': 'Only sellers can delete products'}, 
                       status=status.HTTP_403_FORBIDDEN)
    
    product = get_object_or_404(Product, pk=pk, seller=request.user)
    product.delete()
    return Response({'message': 'Product deleted successfully'}, 
                   status=status.HTTP_204_NO_CONTENT)