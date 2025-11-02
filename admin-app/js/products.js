'use strict';

/* global appwriteClient, APPWRITE_CONFIG, appShell */

const appwriteSdk = window.Appwrite;

const productsModule = (() => {
    const selectors = {
        listContainer: document.getElementById('productsList'),
        emptyState: document.getElementById('productsEmptyState'),
        searchInput: document.getElementById('productsSearch'),
        addButton: document.getElementById('addProductBtn'),
        editor: document.getElementById('productEditor'),
        editorTitle: document.getElementById('productEditorTitle'),
        editorForm: document.getElementById('productEditorForm'),
        editorClose: document.querySelector('[data-close-editor]'),
        imageInput: document.getElementById('productImage'),
        imagePreview: document.getElementById('productImagePreview'),
        chipFilter: document.getElementById('categoryFilter')
    };

    const fields = [
        'name_ar',
        'name_en',
        'sku',
        'price',
        'discount',
        'current_stock',
        'initial_stock',
        'category',
        'badge',
        'description_ar',
        'description_en'
    ];

    const state = {
        items: [],
        search: '',
        category: 'all',
        editing: null,
        uploadingFileId: null,
        uploadingUrl: null
    };

    function parseNumber(value) {
        if (value === null || value === undefined) return 0;
        const normalized = value.toString().replace(/[^0-9.-]/g, '');
        if (!normalized) return 0;
        const parsed = Number(normalized);
        return Number.isNaN(parsed) ? 0 : parsed;
    }

    async function init() {
        if (!selectors.listContainer) return;
        selectors.searchInput?.addEventListener('input', handleSearch);
        selectors.addButton?.addEventListener('click', () => openEditor());
        document
            .querySelectorAll('[data-close-editor]')
            .forEach((closeBtn) => closeBtn.addEventListener('click', closeEditor));
        selectors.editor?.addEventListener('click', (event) => {
            if (event.target === selectors.editor) closeEditor();
        });
        selectors.editorForm?.addEventListener('submit', handleSubmit);
        selectors.imageInput?.addEventListener('change', handleImageSelect);
        selectors.chipFilter?.addEventListener('click', handleCategoryClick);
        await loadProducts();
    }

    async function loadProducts() {
        try {
            appShell.setLoading(true);
            const response = await appwriteClient.databases.listDocuments(
                APPWRITE_CONFIG.databaseId,
                APPWRITE_CONFIG.productsCollectionId,
                [appwriteSdk.Query.limit(200), appwriteSdk.Query.orderDesc('$createdAt')]
            );
            state.items = response.documents;
            renderProducts();
        } catch (error) {
            console.error('Failed to load products', error);
            appShell.showToast('تعذر تحميل المنتجات');
        } finally {
            appShell.setLoading(false);
        }
    }

    function handleSearch(event) {
        state.search = event.target.value.trim().toLowerCase();
        renderProducts();
    }

    function handleCategoryClick(event) {
        const button = event.target.closest('button[data-category]');
        if (!button) return;
        state.category = button.dataset.category;
        document
            .querySelectorAll('#categoryFilter button')
            .forEach((chip) => chip.classList.toggle('is-active', chip === button));
        renderProducts();
    }

    function getFilteredItems() {
        return state.items.filter((item) => {
            const matchesCategory =
                state.category === 'all' || (item.category || '').toLowerCase() === state.category;
            if (!matchesCategory) return false;
            if (!state.search) return true;
            const fieldsToSearch = [item.name_ar, item.name_en, item.sku, item.category];
            return fieldsToSearch.some((value) =>
                (value || '').toString().toLowerCase().includes(state.search)
            );
        });
    }

    function renderProducts() {
        if (!selectors.listContainer) return;
        const items = getFilteredItems();
        selectors.listContainer.innerHTML = '';
        if (!items.length) {
            selectors.emptyState?.classList.add('is-visible');
            updateStats();
            return;
        }
        selectors.emptyState?.classList.remove('is-visible');
        const fragment = document.createDocumentFragment();
        items.forEach((item) => {
            fragment.appendChild(renderProductCard(item));
        });
        selectors.listContainer.appendChild(fragment);
        updateStats();
    }

    function renderProductCard(product) {
        const card = document.createElement('article');
        card.className = 'product-card';

        const media = document.createElement('div');
        media.className = 'product-card__media';
        const img = document.createElement('img');
        img.src = product.image || 'https://via.placeholder.com/400x400?text=Product';
        img.alt = product.name_ar || product.name_en || 'Product image';
        media.appendChild(img);
        card.appendChild(media);

        const body = document.createElement('div');
        body.className = 'product-card__body';

        const title = document.createElement('h3');
        title.className = 'product-card__title';
        title.textContent = product.name_ar || product.name_en || 'منتج بدون اسم';

        const priceRow = document.createElement('div');
        priceRow.className = 'product-card__meta';

        const price = document.createElement('span');
        price.className = 'product-card__price';
        price.textContent = `${Number(product.price || 0).toFixed(2)} ر.س`;

        const stock = document.createElement('span');
        stock.className = 'product-card__stock';
        stock.textContent = `المخزون: ${product.current_stock ?? 0}`;

        priceRow.append(price, stock);

        const actions = document.createElement('div');
        actions.className = 'product-card__actions';

        const editBtn = document.createElement('button');
        editBtn.className = 'secondary-button';
        editBtn.textContent = 'تعديل';
        editBtn.addEventListener('click', () => openEditor(product));

        const deleteBtn = document.createElement('button');
        deleteBtn.className = 'danger-button';
        deleteBtn.textContent = 'حذف';
        deleteBtn.addEventListener('click', () => confirmDelete(product));

        actions.append(editBtn, deleteBtn);
        body.append(title, priceRow, actions);
        card.appendChild(body);
        return card;
    }

    function openEditor(product) {
        if (!selectors.editor || !selectors.editorForm) return;
        state.editing = product || null;
        selectors.editorTitle.textContent = product ? 'تعديل المنتج' : 'إضافة منتج جديد';
        selectors.editorForm.reset();
        state.uploadingFileId = null;
        state.uploadingUrl = product?.image || null;
        updatePreview(state.uploadingUrl);
        if (product) {
            fields.forEach((field) => {
                const input = selectors.editorForm.elements[field];
                if (!input) return;
                const value = product[field];
                if (['price', 'discount', 'current_stock', 'initial_stock'].includes(field)) {
                    input.value = parseNumber(value);
                } else {
                    input.value = value !== undefined && value !== null ? value : '';
                }
            });
        }
        selectors.editor.classList.add('is-visible');
    }

    function closeEditor() {
        selectors.editor?.classList.remove('is-visible');
        selectors.editorForm?.reset();
        state.editing = null;
        state.uploadingFileId = null;
        state.uploadingUrl = null;
        updatePreview(null);
    }

    function updatePreview(src) {
        if (!selectors.imagePreview) return;
        if (!src) {
            selectors.imagePreview.innerHTML = '<span>لم يتم اختيار صورة</span>';
            return;
        }
        const img = document.createElement('img');
        img.src = src;
        selectors.imagePreview.innerHTML = '';
        selectors.imagePreview.appendChild(img);
    }

    async function handleImageSelect(event) {
        const file = event.target.files?.[0];
        if (!file) {
            state.uploadingFileId = null;
            state.uploadingUrl = null;
            updatePreview(null);
            return;
        }
        try {
            appShell.setLoading(true);
            const fileId = appwriteSdk.ID.unique();
            const uploaded = await appwriteClient.storage.createFile(
                APPWRITE_CONFIG.storageBucketId,
                fileId,
                file
            );
            state.uploadingFileId = uploaded.$id;
            state.uploadingUrl = `${APPWRITE_CONFIG.endpoint}/storage/buckets/${APPWRITE_CONFIG.storageBucketId}/files/${uploaded.$id}/view?project=${APPWRITE_CONFIG.projectId}&mode=admin`;
            updatePreview(state.uploadingUrl);
            appShell.showToast('تم رفع الصورة بنجاح');
        } catch (error) {
            console.error('Image upload failed', error);
            appShell.showToast('تعذر رفع الصورة');
            state.uploadingFileId = null;
            state.uploadingUrl = null;
            updatePreview(null);
        } finally {
            appShell.setLoading(false);
        }
    }

    async function handleSubmit(event) {
        event.preventDefault();
        if (!selectors.editorForm) return;
        const payload = {};
        fields.forEach((field) => {
            const input = selectors.editorForm.elements[field];
            if (!input) return;
            const value = input.value.trim();
            if (['price', 'discount', 'current_stock', 'initial_stock'].includes(field)) {
                payload[field] = parseNumber(value);
            } else {
                payload[field] = value || '';
            }
        });
        if (state.uploadingUrl) {
            payload.image = state.uploadingUrl;
            payload.imageId = state.uploadingFileId;
        } else if (!state.editing) {
            payload.image = '';
        }
        try {
            appShell.setLoading(true);
            if (state.editing) {
                await appwriteClient.databases.updateDocument(
                    APPWRITE_CONFIG.databaseId,
                    APPWRITE_CONFIG.productsCollectionId,
                    state.editing.$id,
                    payload
                );
                appShell.showToast('تم تحديث المنتج');
            } else {
                await appwriteClient.databases.createDocument(
                    APPWRITE_CONFIG.databaseId,
                    APPWRITE_CONFIG.productsCollectionId,
                    appwriteSdk.ID.unique(),
                    payload
                );
                appShell.showToast('تم إضافة المنتج');
            }
            await loadProducts();
            closeEditor();
        } catch (error) {
            console.error('Failed to save product', error);
            appShell.showToast('تعذر حفظ المنتج');
        } finally {
            appShell.setLoading(false);
        }
    }

    function confirmDelete(product) {
        const confirmed = window.confirm(`هل تريد حذف المنتج "${product.name_ar || product.name_en}"؟`);
        if (!confirmed) return;
        deleteProduct(product.$id);
    }

    async function deleteProduct(documentId) {
        try {
            appShell.setLoading(true);
            await appwriteClient.databases.deleteDocument(
                APPWRITE_CONFIG.databaseId,
                APPWRITE_CONFIG.productsCollectionId,
                documentId
            );
            appShell.showToast('تم حذف المنتج');
            await loadProducts();
        } catch (error) {
            console.error('Failed to delete product', error);
            appShell.showToast('تعذر حذف المنتج');
        } finally {
            appShell.setLoading(false);
        }
    }

    function onShow() {
        // Refresh when returning to view to pick up external changes
        loadProducts();
    }

    function updateStats() {
        const activeCount = document.getElementById('statActiveProducts');
        const lowStockCount = document.getElementById('statLowStock');
        if (activeCount) activeCount.textContent = state.items.length;
        if (lowStockCount) {
            const lowStock = state.items.filter((item) => Number(item.current_stock || 0) <= 5).length;
            lowStockCount.textContent = lowStock;
        }
    }

    return {
        init,
        onShow
    };
})();

window.productsModule = productsModule;
