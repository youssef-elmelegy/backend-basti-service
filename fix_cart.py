import re

cart_file = "src/modules/cart/services/cart.service.ts"
with open(cart_file, "r") as f:
    text = f.read()

text = re.sub(r',\s*,\s*offer: \(featuredCake as any\)\.offer \|\| null', r', offer: (featuredCake as any).offer || null', text)
text = re.sub(r'(\s*,\s*offer: \(featuredCake as any\)\.offer \|\| null)+', r', offer: (featuredCake as any).offer || null', text)

with open(cart_file, "w") as f:
    f.write(text)

