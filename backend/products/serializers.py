from rest_framework import serializers
from .models import Product, ProductImage

class ProductImageSerializer(serializers.ModelSerializer):
    class Meta:
        model = ProductImage
        fields = ['id', 'image', 'alt_text', 'order', 'created_at']

class ProductSerializer(serializers.ModelSerializer):
    store_name = serializers.ReadOnlyField()
    seller_name = serializers.CharField(source='seller.full_name', read_only=True)
    images = ProductImageSerializer(many=True, read_only=True)
    primary_image = serializers.ReadOnlyField()
    
    class Meta:
        model = Product
        fields = ['id', 'name', 'description', 'price', 'stock', 'image', 'images', 'primary_image', 'store_name', 'seller_name', 'is_active', 'created_at', 'updated_at']
        read_only_fields = ['id', 'created_at', 'updated_at', 'store_name', 'seller_name']

class ProductCreateUpdateSerializer(serializers.ModelSerializer):
    images = serializers.ListField(
        child=serializers.ImageField(),
        write_only=True,
        required=False
    )
    
    class Meta:
        model = Product
        fields = ['name', 'description', 'price', 'stock', 'image', 'images', 'is_active']
        
    def validate_price(self, value):
        if value <= 0:
            raise serializers.ValidationError("Price must be greater than 0")
        return value
        
    def validate_stock(self, value):
        if value < 0:
            raise serializers.ValidationError("Stock cannot be negative")
        return value

    def create(self, validated_data):
        images_data = validated_data.pop('images', [])
        product = Product.objects.create(**validated_data)
        
        # Create product images
        for i, image_data in enumerate(images_data):
            ProductImage.objects.create(
                product=product,
                image=image_data,
                order=i
            )
        
        return product

    def update(self, instance, validated_data):
        images_data = validated_data.pop('images', None)
        
        # Update product fields
        for attr, value in validated_data.items():
            setattr(instance, attr, value)
        instance.save()
        
        # Update images if provided
        if images_data is not None:
            # Clear existing images
            instance.images.all().delete()
            
            # Create new images
            for i, image_data in enumerate(images_data):
                ProductImage.objects.create(
                    product=instance,
                    image=image_data,
                    order=i
                )
        
        return instance

class ProductListSerializer(serializers.ModelSerializer):
    store_name = serializers.ReadOnlyField()
    seller_name = serializers.CharField(source='seller.full_name', read_only=True)
    primary_image = serializers.ReadOnlyField()
    
    class Meta:
        model = Product
        fields = ['id', 'name', 'price', 'stock', 'image', 'primary_image', 'store_name', 'seller_name', 'is_active']