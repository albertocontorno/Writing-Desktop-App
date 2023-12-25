export function clamp(x: number, min: number, max: number): number{
  return Math.min(Math.max(x, min), max);
}

export function generateUUID(){
  return crypto.randomUUID()
}

export function getCurrentNodeFromList(nodes, n): number{
  let index = -1;
  for (const node of nodes) {
    index++;
    if(node === n) return index;
  }
  return index;
}

export function getCurrentItem() {
  let currentNode = window.getSelection()?.anchorNode;

  if (currentNode?.nodeType !== Node.ELEMENT_NODE) {
    currentNode = currentNode?.parentNode;
  }

  return currentNode;
}