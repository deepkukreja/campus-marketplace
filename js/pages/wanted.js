import { createHeader } from "../components/header.js";
import { getWantedPosts } from "../services/wanted-service.js";

const app = document.querySelector("#app");

const header = createHeader("..");

app.append(header);

const main = document.createElement("main");

main.className = "wanted-page";

main.innerHTML = `
    <section class="wanted-intro">
        <p class="home-kicker">Wanted Board</p>

        <div class="wanted-heading">
            <div>
                <h1>
                    Tell the campus what you need.
                </h1>

                <p>
                    Browse requests from students looking
                    for items across campus.
                </p>
            </div>

            <a
                class="button button--primary"
                href="./create-wanted.html"
            >
                Post a Wanted Request
            </a>
        </div>
    </section>

    <section
        class="wanted-section"
        aria-labelledby="wanted-section-title"
    >
        <div class="wanted-section__header">
            <div class="section-heading">
                <h2 id="wanted-section-title">
                    Open requests
                </h2>

                <p id="wanted-count"></p>
            </div>
        </div>

        <div
            id="wanted-grid"
            class="wanted-grid"
        ></div>

        <div
            id="wanted-empty"
            class="wanted-empty"
            hidden
        >
            <h3>No wanted requests yet</h3>

            <p>
                There are currently no open requests.
            </p>
        </div>
    </section>
`;

app.append(main);

const wantedGrid =
    main.querySelector("#wanted-grid");

const wantedCount =
    main.querySelector("#wanted-count");

const wantedEmpty =
    main.querySelector("#wanted-empty");

const posts = getWantedPosts().filter(
    (post) => post.status === "open"
);

wantedCount.textContent =
    `${posts.length} open request${posts.length === 1 ? "" : "s"}`;

wantedEmpty.hidden = posts.length !== 0;

posts.forEach((post) => {
    wantedGrid.append(
        createWantedCard(post)
    );
});

function createWantedCard(post) {
    const article =
        document.createElement("article");

    article.className = "wanted-card";

    const link =
        document.createElement("a");

    link.className =
        "wanted-card__link";

    link.href =
        `./wanted-detail.html?id=${encodeURIComponent(
            post.id
        )}`;

    link.setAttribute(
        "aria-label",
        `View wanted request: ${post.title}`
    );

    const category =
        document.createElement("div");

    category.className =
        "wanted-card__category";

    category.textContent =
        post.category;

    const content =
        document.createElement("div");

    content.className =
        "wanted-card__content";

    const title =
        document.createElement("h3");

    title.className =
        "wanted-card__title";

    title.textContent =
        post.title;

    const description =
        document.createElement("p");

    description.className =
        "wanted-card__description";

    description.textContent =
        post.description;

    const budget =
        document.createElement("div");

    budget.className =
        "wanted-card__budget";

    const budgetLabel =
        document.createElement("span");

    budgetLabel.textContent =
        "Budget";

    const budgetValue =
        document.createElement("strong");

    budgetValue.textContent =
        `₹${post.minBudget} – ₹${post.maxBudget}`;

    budget.append(
        budgetLabel,
        budgetValue
    );

    const footer =
        document.createElement("div");

    footer.className =
        "wanted-card__footer";

    const deadline =
        document.createElement("span");

    deadline.textContent =
        `Needed by ${formatDate(post.deadline)}`;

    const location =
        document.createElement("span");

    location.textContent =
        post.location;

    footer.append(
        deadline,
        location
    );

    content.append(
        title,
        description,
        budget,
        footer
    );

    link.append(
        category,
        content
    );

    article.append(link);

    return article;
}

function formatDate(dateString) {
    const date =
        new Date(`${dateString}T00:00:00`);

    return new Intl.DateTimeFormat(
        "en-IN",
        {
            day: "numeric",
            month: "short",
            year: "numeric"
        }
    ).format(date);
}