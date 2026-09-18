export function renderHome(container) {
    container.innerHTML = `
        <main class="home">
            <section class="home-intro" aria-labelledby="home-title">
                <p class="home-kicker">Campus marketplace</p>

                <h1 id="home-title">
                    Find what you need. Pass on what you don't.
                </h1>

                <p class="home-description">
                    Buy, sell, rent, swap, or give away items within your campus community.
                </p>

                <div class="home-actions">
                    <a class="button button--primary" href="./pages/marketplace.html">
                        Browse Marketplace
                    </a>

                    <a class="button button--secondary" href="./pages/create-listing.html">
                        Post an Item
                    </a>
                </div>
            </section>

            <section class="home-categories" aria-labelledby="categories-title">
                <div class="section-heading">
                    <h2 id="categories-title">Browse by category</h2>
                    <p>Start with the kind of item you're looking for.</p>
                </div>

                <div class="category-list">
                    <a class="category-item" href="./pages/marketplace.html">
                        Electronics
                    </a>

                    <a class="category-item" href="./pages/marketplace.html">
                        Books
                    </a>

                    <a class="category-item" href="./pages/marketplace.html">
                        Hostel
                    </a>

                    <a class="category-item" href="./pages/marketplace.html">
                        Furniture
                    </a>

                    <a class="category-item" href="./pages/marketplace.html">
                        Sports
                    </a>

                    <a class="category-item" href="./pages/marketplace.html">
                        Academic
                    </a>

                    <a class="category-item" href="./pages/marketplace.html">
                        Other
                    </a>
                </div>
            </section>
        </main>
    `;
}