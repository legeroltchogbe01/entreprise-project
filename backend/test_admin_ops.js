(async () => {
  const base = process.env.API_URL || 'http://localhost:5000';
  const out = (label, data) => console.log('\n--- ' + label + ' ---\n', data);

  try {
    // 1. Create product field
    console.log('Creating product field...');
    let res = await fetch(base + '/api/admin/product-fields', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ key: 'color_test', label: 'Couleur', type: 'text', options: null, ord: 10 })
    });
    let data = await res.json().catch(() => ({}));
    out('Create field status', { status: res.status, body: data });

    // 2. Create product with custom_data
    console.log('Creating product with custom_data...');
    const fm = new FormData();
    fm.append('name', 'Test Product Dynamic');
    fm.append('description', 'Produit de test avec champ dynamique');
    fm.append('price', '12345');
    fm.append('custom_data', JSON.stringify({ color_test: 'Rouge', warranty: '2 ans' }));

    res = await fetch(base + '/api/products', {
      method: 'POST',
      body: fm
    });
    data = await res.json().catch(() => ({}));
    out('Create product status', { status: res.status, body: data });

    // 3. Fetch products and find our product
    console.log('Fetching products...');
    res = await fetch(base + '/api/products');
    const products = await res.json();
    const found = products.find(p => p.name && p.name.includes('Test Product Dynamic'));
    out('Product fetch count', { count: products.length, found: !!found });
    if (found) out('Found product', found);

    // 4. Fetch companies
    console.log('Fetching companies...');
    res = await fetch(base + '/api/admin/companies');
    const companies = await res.json();
    out('Companies count', companies.length);

    if (companies.length === 0) {
      console.log('No companies to test PDF/view/delete. Skipping company tests.');
      process.exit(0);
    }

    const comp = companies[0];
    out('Using company', { id: comp.id, manager_cip_pdf: comp.manager_cip_pdf });

    // 5. Try to GET the manager_cip_pdf if present
    if (comp.manager_cip_pdf) {
      const pdfUrl = comp.manager_cip_pdf.startsWith('http') ? comp.manager_cip_pdf : base + '/uploads/' + comp.manager_cip_pdf;
      console.log('Checking PDF URL:', pdfUrl);
      try {
        const pdfRes = await fetch(pdfUrl, { method: 'HEAD' });
        out('PDF URL HEAD status', pdfRes.status);
      } catch (err) {
        out('PDF URL fetch error', err.message || err);
      }
    } else {
      console.log('Company has no manager_cip_pdf set.');
    }

    // 6. Delete the company
    console.log('Deleting company id:', comp.id);
    res = await fetch(base + '/api/admin/companies/' + comp.id, { method: 'DELETE' });
    data = await res.json().catch(() => ({}));
    out('Delete company status', { status: res.status, body: data });

    // 7. Verify deletion
    res = await fetch(base + '/api/admin/companies');
    const companiesAfter = await res.json();
    out('Companies after delete count', companiesAfter.length);

  } catch (e) {
    console.error('Test script error:', e);
    process.exit(1);
  }
})();
