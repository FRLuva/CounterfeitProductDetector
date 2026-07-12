from django.shortcuts import render


def comparison(request, product_id):

    products = {

        1: {

            "user_product": {
                "name": "Nike Air Max",
                "brand": "Nike",
                "price": "$35",
                "barcode": "1234567890123",
            },

            "original_product": {
                "name": "Nike Air Max",
                "brand": "Nike",
                "price": "$180",
                "barcode": "1234567890123",
            },

            "score": 95,
            "verdict": "Authentic",
            "reason": "Packaging, logo and barcode match the original product."

        },

        2: {

            "user_product": {
                "name": "Apple AirPods Pro",
                "brand": "Apple",
                "price": "$40",
                "barcode": "2222222222222",
            },

            "original_product": {
                "name": "Apple AirPods Pro",
                "brand": "Apple",
                "price": "$249",
                "barcode": "1111111111111",
            },

            "score": 22,
            "verdict": "Fake",
            "reason": "Barcode mismatch and packaging quality differ from the original."

        },

        3: {

            "user_product": {
                "name": "Samsung USB Charger",
                "brand": "Samsung",
                "price": "$12",
                "barcode": "3333333333333",
            },

            "original_product": {
                "name": "Samsung USB Charger",
                "brand": "Samsung",
                "price": "$25",
                "barcode": "3333333333333",
            },

            "score": 84,
            "verdict": "Likely Authentic",
            "reason": "Most features match the original, but packaging differs slightly."

        },

        4: {

            "user_product": {
                "name": "Sony Headphones",
                "brand": "Sony",
                "price": "$45",
                "barcode": "4444444444444",
            },

            "original_product": {
                "name": "Sony Headphones",
                "brand": "Sony",
                "price": "$199",
                "barcode": "5555555555555",
            },

            "score": 56,
            "verdict": "Fake",
            "reason": "Logo placement and barcode do not match the genuine product."

        },

        5: {

            "user_product": {
                "name": "Nivea Acne Control Cleanser",
                "brand": "Nivea",
                "price": "$9",
                "barcode": "6666666666666",
            },

            "original_product": {
                "name": "Nivea Acne Control Cleanser",
                "brand": "Nivea",
                "price": "$18",
                "barcode": "6666666666666",
            },

            "score": 78,
            "verdict": "Likely Authentic",
            "reason": "Ingredients and barcode match, but the packaging design differs."

        }

    }

    comparison_data = products.get(product_id)

    return render(
        request,
        "product_comparison/comparison.html",
        comparison_data
    )