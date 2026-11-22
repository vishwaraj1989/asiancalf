export function animateCartToHeader(sourceElement) {
  if (!sourceElement || window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
  const cartTarget = document.getElementById('cart-nav-link');
  if (!cartTarget) return;
  const source = sourceElement.getBoundingClientRect();
  const target = cartTarget.getBoundingClientRect();
  const startX = source.left + source.width / 2;
  const startY = source.top + source.height / 2;
  const endX = target.left + target.width / 2;
  const endY = target.top + target.height / 2;
  const basket = document.createElement('div');
  basket.className = 'flying-cart-icon';
  basket.style.left = `${startX}px`;
  basket.style.top = `${startY}px`;
  basket.innerHTML = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M7 18c-1.1 0-1.99.9-1.99 2S5.9 22 7 22s2-.9 2-2-.9-2-2-2ZM1 2v2h2l3.6 7.59-1.35 2.45A2 2 0 0 0 7 17h12v-2H7.42a.25.25 0 0 1-.22-.37L8.1 13h7.45c.75 0 1.41-.41 1.75-1.03L20.88 5.5A1 1 0 0 0 20 4H5.21l-.94-2H1Zm16 16c-1.1 0-1.99.9-1.99 2S15.9 22 17 22s2-.9 2-2-.9-2-2-2Z" /></svg>';
  document.body.appendChild(basket);
  const animation = basket.animate([{ transform: 'translate(-50%, -50%) scale(.7)', opacity: 0 }, { transform: 'translate(-50%, -50%) scale(1.15)', opacity: 1, offset: 0.14 }, { transform: `translate(calc(-50% + ${endX - startX}px), calc(-50% + ${endY - startY}px)) scale(.55)`, opacity: 1 }], { duration: 720, easing: 'cubic-bezier(.2,.85,.25,1)', fill: 'forwards' });
  animation.onfinish = () => { basket.remove(); cartTarget.classList.add('cart-arrival-bump'); window.setTimeout(() => cartTarget.classList.remove('cart-arrival-bump'), 380); };
}
