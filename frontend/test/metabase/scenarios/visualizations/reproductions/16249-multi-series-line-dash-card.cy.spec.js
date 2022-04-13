import { restore, popover, visitDashboard } from "__support__/e2e/cypress";

import { SAMPLE_DATABASE } from "__support__/e2e/cypress_sample_database";

const { ORDERS, ORDERS_ID } = SAMPLE_DATABASE;

describe("multi series line chart dashcard (metabase#16249) ", () => {
  beforeEach(() => {
    restore();
    cy.signInAsAdmin();

    cy.intercept("PUT", "/api/dashboard/*").as("updateDashboard");
    cy.intercept("PUT", "/api/dashboard/*/cards").as("updateDashboardCards");
  });

  it("should show correct column title in tooltip before & after editing via visualization options", () => {
    cy.createQuestion({
      name: "Q1",
      query: {
        "source-table": ORDERS_ID,
        aggregation: [
          ["avg", ["field", ORDERS.TOTAL, null]],
          ["cum-sum", ["field", ORDERS.QUANTITY, null]],
        ],
        breakout: [["field", ORDERS.CREATED_AT, { "temporal-unit": "year" }]],
      },
      display: "line",
    }).then(({ body: { id: card1Id } }) => {
      cy.createDashboard().then(({ body: { id: dashboardId } }) => {
        cy.request("POST", `/api/dashboard/${dashboardId}/cards`, {
          cardId: card1Id,
        }).then(({ body: { id: dashCardId } }) => {
          cy.request("PUT", `/api/dashboard/${dashboardId}/cards`, {
            cards: [
              {
                id: dashCardId,
                card_id: card1Id,
                row: 0,
                col: 0,
                sizeX: 18,
                sizeY: 12,
                parameter_mappings: [],
              },
            ],
          }).then(() => {
            visitDashboard(dashboardId);

            // check the original names in the tooltip
            showTooltipForFirstCircleInSeries(0);
            popover().within(() => {
              testPairedTooltipValues("Created At", "2016");
              testPairedTooltipValues("Average of Total", "56.66");
              testPairedTooltipValues("Sum of Quantity", "3,236");
            });

            showTooltipForFirstCircleInSeries(1);
            popover().within(() => {
              testPairedTooltipValues("Created At", "2016");
              testPairedTooltipValues("Average of Total", "56.66");
              testPairedTooltipValues("Sum of Quantity", "3,236");
            });

            cy.icon("pencil").click();
            cy.get(".Card").realHover();
            cy.icon("palette").click();

            // check the original names in the tooltip of the viz found within the Visualization Options modal
            showTooltipForFirstCircleInSeries(0, { withinModal: true });
            popover().within(() => {
              testPairedTooltipValues("Created At", "2016");
              testPairedTooltipValues("Average of Total", "56.66");
              testPairedTooltipValues("Sum of Quantity", "3,236");
            });

            showTooltipForFirstCircleInSeries(1, { withinModal: true });
            popover().within(() => {
              testPairedTooltipValues("Created At", "2016");
              testPairedTooltipValues("Average of Total", "56.66");
              testPairedTooltipValues("Sum of Quantity", "3,236");
            });

            // update the y column title
            cy.findByDisplayValue("Average of Total")
              .clear()
              .type("Altered Average of Total");

            cy.findByDisplayValue("Sum of Quantity")
              .clear()
              .type("Altered Sum of Quantity");

            // check the altered name in the tooltip of the viz found within the Visualization Options modal
            showTooltipForFirstCircleInSeries(0, { withinModal: true });
            popover().within(() => {
              testPairedTooltipValues("Created At", "2016");
              testPairedTooltipValues("Altered Average of Total", "56.66");
              testPairedTooltipValues("Altered Sum of Quantity", "3,236");
            });

            showTooltipForFirstCircleInSeries(1, { withinModal: true });
            popover().within(() => {
              testPairedTooltipValues("Created At", "2016");
              testPairedTooltipValues("Altered Average of Total", "56.66");
              testPairedTooltipValues("Altered Sum of Quantity", "3,236");
            });

            cy.get(".Modal").within(() => {
              cy.findByText("Done").click();
            });
            cy.findByText("Save").click();

            cy.wait(["@updateDashboard", "@updateDashboardCards"]);

            // check the altered column name in the dashcard
            showTooltipForFirstCircleInSeries(0);
            popover().within(() => {
              testPairedTooltipValues("Created At", "2016");
              testPairedTooltipValues("Altered Average of Total", "56.66");
              testPairedTooltipValues("Altered Sum of Quantity", "3,236");
            });

            showTooltipForFirstCircleInSeries(1);
            popover().within(() => {
              testPairedTooltipValues("Created At", "2016");
              testPairedTooltipValues("Altered Average of Total", "56.66");
              testPairedTooltipValues("Altered Sum of Quantity", "3,236");
            });
          });
        });
      });
    });
  });

  it("should show correct column titles (with added series) in tooltip on hover over a data point", () => {
    cy.createQuestion({
      name: "Q1",
      query: {
        "source-table": ORDERS_ID,
        aggregation: [
          ["avg", ["field", ORDERS.TOTAL, null]],
          ["cum-sum", ["field", ORDERS.QUANTITY, null]],
        ],
        breakout: [["field", ORDERS.CREATED_AT, { "temporal-unit": "year" }]],
      },
      display: "line",
    }).then(({ body: { id: card1Id } }) => {
      cy.createQuestion({
        name: "Q2",
        query: {
          "source-table": ORDERS_ID,
          aggregation: [
            ["avg", ["field", ORDERS.DISCOUNT, null]],
            ["sum", ["field", ORDERS.DISCOUNT, null]],
          ],
          breakout: [["field", ORDERS.CREATED_AT, { "temporal-unit": "year" }]],
        },
        display: "line",
      }).then(({ body: { id: card2Id } }) => {
        cy.createDashboard().then(({ body: { id: dashboardId } }) => {
          cy.request("POST", `/api/dashboard/${dashboardId}/cards`, {
            cardId: card1Id,
          }).then(({ body: { id: dashCardId } }) => {
            cy.request("PUT", `/api/dashboard/${dashboardId}/cards`, {
              cards: [
                {
                  id: dashCardId,
                  card_id: card1Id,
                  row: 0,
                  col: 0,
                  sizeX: 18,
                  sizeY: 12,
                  series: [{ id: card2Id }],
                  parameter_mappings: [],
                },
              ],
            }).then(() => {
              visitDashboard(dashboardId);

              // check the original names in the tooltip
              showTooltipForFirstCircleInSeries(0);
              popover().within(() => {
                testPairedTooltipValues("Created At", "2016");
                testPairedTooltipValues("Average of Total", "56.66");
                testPairedTooltipValues("Sum of Quantity", "3,236");
              });

              showTooltipForFirstCircleInSeries(1);
              popover().within(() => {
                testPairedTooltipValues("Created At", "2016");
                testPairedTooltipValues("Average of Total", "56.66");
                testPairedTooltipValues("Sum of Quantity", "3,236");
              });

              showTooltipForFirstCircleInSeries(2);
              popover().within(() => {
                testPairedTooltipValues("Created At", "2016");
                testPairedTooltipValues("Average of Discount", "5.03");
                testPairedTooltipValues("Sum of Discount", "342.09");
              });

              showTooltipForFirstCircleInSeries(3);
              popover().within(() => {
                testPairedTooltipValues("Created At", "2016");
                testPairedTooltipValues("Average of Discount", "5.03");
                testPairedTooltipValues("Sum of Discount", "342.09");
              });

              cy.icon("pencil").click();
              cy.get(".Card").realHover();
              cy.icon("palette").click();

              // check the original names in the tooltip of the viz found within the Visualization Options modal
              showTooltipForFirstCircleInSeries(0, { withinModal: true });
              popover().within(() => {
                testPairedTooltipValues("Created At", "2016");
                testPairedTooltipValues("Average of Total", "56.66");
                testPairedTooltipValues("Sum of Quantity", "3,236");
              });

              showTooltipForFirstCircleInSeries(1, { withinModal: true });
              popover().within(() => {
                testPairedTooltipValues("Created At", "2016");
                testPairedTooltipValues("Average of Total", "56.66");
                testPairedTooltipValues("Sum of Quantity", "3,236");
              });

              showTooltipForFirstCircleInSeries(2, { withinModal: true });
              popover().within(() => {
                testPairedTooltipValues("Created At", "2016");
                testPairedTooltipValues("Average of Discount", "5.03");
                testPairedTooltipValues("Sum of Discount", "342.09");
              });

              showTooltipForFirstCircleInSeries(3, { withinModal: true });
              popover().within(() => {
                testPairedTooltipValues("Created At", "2016");
                testPairedTooltipValues("Average of Discount", "5.03");
                testPairedTooltipValues("Sum of Discount", "342.09");
              });

              // update the y column title
              cy.findByDisplayValue("Q1: Average of Total")
                .clear()
                .type("Q1: Altered Average of Total");

              cy.findByDisplayValue("Q1: Sum of Quantity")
                .clear()
                .type("Q1: Altered Sum of Quantity");

              cy.findByDisplayValue("Q2: Average of Discount")
                .clear()
                .type("Q2: Altered Average of Discount");

              cy.findByDisplayValue("Q2: Sum of Discount")
                .clear()
                .type("Q2: Altered Sum of Discount");

              // check the altered name in the tooltip of the viz found within the Visualization Options modal
              showTooltipForFirstCircleInSeries(0, { withinModal: true });
              popover().within(() => {
                testPairedTooltipValues("Created At", "2016");
                testPairedTooltipValues(
                  "Q1: Altered Average of Total",
                  "56.66",
                );
                testPairedTooltipValues("Q1: Altered Sum of Quantity", "3,236");
              });

              showTooltipForFirstCircleInSeries(1, { withinModal: true });
              popover().within(() => {
                testPairedTooltipValues("Created At", "2016");
                testPairedTooltipValues(
                  "Q1: Altered Average of Total",
                  "56.66",
                );
                testPairedTooltipValues("Q1: Altered Sum of Quantity", "3,236");
              });

              showTooltipForFirstCircleInSeries(2, { withinModal: true });
              popover().within(() => {
                testPairedTooltipValues("Created At", "2016");
                testPairedTooltipValues(
                  "Q2: Altered Average of Discount",
                  "5.03",
                );
                testPairedTooltipValues(
                  "Q2: Altered Sum of Discount",
                  "342.09",
                );
              });

              showTooltipForFirstCircleInSeries(3, { withinModal: true });
              popover().within(() => {
                testPairedTooltipValues("Created At", "2016");
                testPairedTooltipValues(
                  "Q2: Altered Average of Discount",
                  "5.03",
                );
                testPairedTooltipValues(
                  "Q2: Altered Sum of Discount",
                  "342.09",
                );
              });

              cy.get(".Modal").within(() => {
                cy.findByText("Done").click();
              });
              cy.findByText("Save").click();

              cy.wait(["@updateDashboard", "@updateDashboardCards"]);

              // check the altered column name in the dashcard
              showTooltipForFirstCircleInSeries(0);
              popover().within(() => {
                testPairedTooltipValues("Created At", "2016");
                testPairedTooltipValues(
                  "Q1: Altered Average of Total",
                  "56.66",
                );
                testPairedTooltipValues("Q1: Altered Sum of Quantity", "3,236");
              });

              showTooltipForFirstCircleInSeries(1);
              popover().within(() => {
                testPairedTooltipValues("Created At", "2016");
                testPairedTooltipValues(
                  "Q1: Altered Average of Total",
                  "56.66",
                );
                testPairedTooltipValues("Q1: Altered Sum of Quantity", "3,236");
              });

              showTooltipForFirstCircleInSeries(2);
              popover().within(() => {
                testPairedTooltipValues("Created At", "2016");
                testPairedTooltipValues(
                  "Q2: Altered Average of Discount",
                  "5.03",
                );
                testPairedTooltipValues(
                  "Q2: Altered Sum of Discount",
                  "342.09",
                );
              });

              showTooltipForFirstCircleInSeries(3);
              popover().within(() => {
                testPairedTooltipValues("Created At", "2016");
                testPairedTooltipValues(
                  "Q2: Altered Average of Discount",
                  "5.03",
                );
                testPairedTooltipValues(
                  "Q2: Altered Sum of Discount",
                  "342.09",
                );
              });
            });
          });
        });
      });
    });
  });
});

function showTooltipForFirstCircleInSeries(
  series_index,
  { withinModal } = { withinModal: false },
) {
  if (withinModal) {
    cy.get(".Modal").within(() => {
      cy.get(`.sub._${series_index}`)
        .as("firstSeries")
        .find("circle")
        .first()
        .trigger("mousemove", { force: true });
    });
  } else {
    cy.get(`.sub._${series_index}`)
      .as("firstSeries")
      .find("circle")
      .first()
      .trigger("mousemove", { force: true });
  }
}

function testPairedTooltipValues(val1, val2) {
  cy.contains(val1)
    .closest("td")
    .siblings("td")
    .findByText(val2);
}
