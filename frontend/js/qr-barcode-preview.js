function renderBarcodePreview(svgEl, value) {
  if (!value) { svgEl.innerHTML = ''; return; }
  try {
    JsBarcode(svgEl, value, { format: 'CODE128', displayValue: true, height: 50, width: 1.5 });
  } catch {
    svgEl.innerHTML = '';
  }
}
