document.addEventListener("DOMContentLoaded", function () {

    const searchInput = document.getElementById("searchInput");
    const resultFilter = document.getElementById("resultFilter");
    const rows = document.querySelectorAll(".verification-row");

    function filterTable() {

        const searchText = searchInput.value.toLowerCase().trim();
        const selectedResult = resultFilter.value;

        rows.forEach(function (row) {

            const product =
                row.dataset.product.toLowerCase();

            const result =
                row.dataset.result;

            const matchesSearch =
                product.includes(searchText);

            const matchesFilter =
                selectedResult === "All Results" ||
                result === selectedResult;

            if (matchesSearch && matchesFilter) {

                row.style.display = "";

            }

            else {

                row.style.display = "none";

            }

        });

    }

    searchInput.addEventListener("keyup", filterTable);

    resultFilter.addEventListener("change", filterTable);

});