import { restore, popover, visitDashboard } from "__support__/e2e/cypress";

import { SAMPLE_DATABASE } from "__support__/e2e/cypress_sample_database";

const { ORDERS, ORDERS_ID } = SAMPLE_DATABASE;

describe("single series line chart dashcard (metabase#16249) ", () => {
  beforeEach(() => {
    restore();
    cy.signInAsAdmin();
  });

  it("should show correct column title in tooltip before & after editing via visualization options", () => {
    cy.createQuestion({
      name: "Q1",
      query: {
        "source-table": ORDERS_ID,
        aggregation: [["sum", ["field", ORDERS.TOTAL, null]]],
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
              testPairedTooltipValues("Sum of Total", "42,156.87");
            });

            cy.icon("pencil").click();
            cy.get(".Card").realHover();
            cy.icon("palette").click();

            // check the original names in the tooltip of the viz found within the Visualization Options modal
            showTooltipForFirstCircleInSeries(0, { withinModal: true });
            popover().within(() => {
              testPairedTooltipValues("Created At", "2016");
              testPairedTooltipValues("Sum of Total", "42,156.87");
            });

            // update the y column title
            cy.findByDisplayValue("Sum of Total")
              .clear()
              .type("Altered Column Title");
            // check the altered name in the tooltip of the viz found within the Visualization Options modal
            showTooltipForFirstCircleInSeries(0, { withinModal: true });
            popover().within(() => {
              testPairedTooltipValues("Created At", "2016");
              testPairedTooltipValues("Altered Column Title", "42,156.87");
            });

            cy.get(".Modal").within(() => {
              cy.findByText("Done").click();
            });
            cy.findByText("Save").click();

            // check the altered column name in the dashcard
            showTooltipForFirstCircleInSeries(0);
            popover().within(() => {
              testPairedTooltipValues("Created At", "2016");
              testPairedTooltipValues("Altered Column Title", "42,156.87");
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
        aggregation: [["sum", ["field", ORDERS.TOTAL, null]]],
        breakout: [["field", ORDERS.CREATED_AT, { "temporal-unit": "year" }]],
      },
      display: "line",
    }).then(({ body: { id: card1Id } }) => {
      cy.createQuestion({
        name: "Q2",
        query: {
          "source-table": ORDERS_ID,
          aggregation: [["avg", ["field", ORDERS.TOTAL, null]]],
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
                testPairedTooltipValues("Sum of Total", "42,156.87");
              });

              showTooltipForFirstCircleInSeries(1);
              popover().within(() => {
                testPairedTooltipValues("Created At", "2016");
                testPairedTooltipValues("Average of Total", "56.66");
              });

              cy.icon("pencil").click();
              cy.get(".Card").realHover();
              cy.icon("palette").click();

              // check the original names in the tooltip of the viz found within the Visualization Options modal
              showTooltipForFirstCircleInSeries(0, { withinModal: true });
              popover().within(() => {
                testPairedTooltipValues("Created At", "2016");
                testPairedTooltipValues("Sum of Total", "42,156.87");
              });

              showTooltipForFirstCircleInSeries(1, { withinModal: true });
              popover().within(() => {
                testPairedTooltipValues("Created At", "2016");
                testPairedTooltipValues("Average of Total", "56.66");
              });

              // update the y column titles
              cy.findByDisplayValue("Q1")
                .clear()
                .type("Altered Q1 Title");
              cy.findByDisplayValue("Q2")
                .clear()
                .type("Altered Q2 Title");

              // check the altered names in the tooltip of the viz found within the Visualization Options modal
              showTooltipForFirstCircleInSeries(0, { withinModal: true });
              popover().within(() => {
                testPairedTooltipValues("Created At", "2016");
                testPairedTooltipValues("Altered Q1 Title", "42,156.87");
              });

              showTooltipForFirstCircleInSeries(1, { withinModal: true });
              popover().within(() => {
                testPairedTooltipValues("Created At", "2016");
                testPairedTooltipValues("Altered Q2 Title", "56.66");
              });

              cy.get(".Modal").within(() => {
                cy.findByText("Done").click();
              });
              cy.findByText("Save").click();

              // check the altered column names in the dashcard
              showTooltipForFirstCircleInSeries(0);
              popover().within(() => {
                testPairedTooltipValues("Created At", "2016");
                testPairedTooltipValues("Altered Q1 Title", "42,156.87");
              });

              showTooltipForFirstCircleInSeries(1);
              popover().within(() => {
                testPairedTooltipValues("Created At", "2016");
                testPairedTooltipValues("Altered Q2 Title", "56.66");
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
