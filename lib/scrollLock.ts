// Ref-counted body scroll lock. A modal can now open while a panel like the
// Navbar account drawer stays open behind it (e.g. What's New opened from
// the account drawer) — a naive set/reset of document.body.style.overflow
// in each component would have the modal's cleanup re-enable scroll while
// the drawer is still open. Counting locks instead means scroll only comes
// back once every lock holder has released it.
let lockCount = 0;

export function lockScroll() {
  lockCount++;
  document.body.style.overflow = "hidden";
}

export function unlockScroll() {
  lockCount = Math.max(0, lockCount - 1);
  if (lockCount === 0) {
    document.body.style.overflow = "";
  }
}
