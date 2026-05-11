import re

cart_file = "src/modules/cart/services/cart.service.ts"
with open(cart_file, "r") as f:
    text = f.read()

# For addon inline creations in cart.service.ts
# item: { ...addon, options: [] }
text = re.sub(r'item:\s*\{\s*\.\.\.addon,\s*options:\s*\[\]\s*\}', r'item: { ...addon, options: [], offer: (addon as any).offer || null }', text)

# For featuredCake
text = re.sub(r'(item:\s*\{\s*\.\.\.featuredCake,[^}]+)\}', r'\1  offer: (featuredCake as any).offer || null\n          }', text)

# For sweet
text = re.sub(r'(item:\s*sweet)', r'item: { ...sweet, offer: (sweet as any).offer || null }', text)

with open(cart_file, "w") as f:
    f.write(text)


order_file = "src/modules/order/services/order.service.ts"
with open(order_file, "r") as f:
    text = f.read()

text = re.sub(r'(data:\s*\{\s*\.\.\.cakeItem,[^}]+)\}', r'\1  offer: null\n            }', text)
text = re.sub(r'(data:\s*\{\s*\.\.\.addonItem,\s*options:\s*\[\],[^}]+)\}', r'\1  offer: null\n            }', text)
text = re.sub(r'(data:\s*\{\s*\.\.\.sweetItem,[^}]+)\}', r'\1  offer: null\n            }', text)

with open(order_file, "w") as f:
    f.write(text)


dto_files = [
    "src/modules/custom-cakes/dto/flavor-response.dto.ts",
    "src/modules/custom-cakes/dto/shape-response.dto.ts",
    "src/modules/custom-cakes/dto/decoration-response.dto.ts",
    "src/modules/custom-cakes/dto/predesigned-cake-response.dto.ts"
]

for d_file in dto_files:
    with open(d_file, "r") as f:
        content = f.read()
    if 'import { ItemOfferDto }' not in content:
        content = "import { ItemOfferDto } from '@/common/dto';\n" + content
    
    # We will search for 'export class ShapeDataDto {' 'export class FlavorDataDto {' 'export class DecorationDataDto {' 'export class PredesignedCakeDataDto {'
    classname = re.search(r'export class ([A-Za-z]+DataDto) \{', content).group(1)
    
    # insert offer inside the class definition, after opening brace
    if 'offer: ItemOfferDto | null' not in content:
        content = content.replace(f'export class {classname} {{', f'export class {classname} {{\n  offer: ItemOfferDto | null;\n')
        with open(d_file, "w") as f:
            f.write(content)
