import { devNavigationMenu } from '../constants/global';
import {
  addPagePO,
  quickStartLeaveModalPO,
  quickStartSidebarPO,
  quickStartsPO,
} from '../pageObjects';
import { catalogPage } from './add-flow/catalog-page';
import { app, navigateTo } from './app';

function clickVisibleButton(el: string) {
  cy.get(quickStartSidebarPO.quickStartSidebarBody).then(($button) => {
    const isVisible = $button.find(el).is(':visible');
    if (isVisible) {
      cy.get(el).click();
      clickVisibleButton(el);
    } else {
      cy.log('quick start is complete');
    }
  });
}

export function closeQuickStart() {
  cy.get(quickStartSidebarPO.quickStartSidebarBody).should('be.visible');
  cy.get(quickStartSidebarPO.closePanel)
    .should('be.visible')
    .click();
  cy.get(quickStartLeaveModalPO.leaveModal).should('be.visible');
  cy.get(quickStartLeaveModalPO.leaveButton)
    .should('be.visible')
    .click();
}

export const quickStartsPage = {
  quickStartsCatalog: () => {
    navigateTo(devNavigationMenu.Add);
    app.waitForDocumentLoad();
    cy.get(addPagePO.viewAllQuickStarts).click();
    cy.get(quickStartsPO.quickStartTitle)
      .scrollIntoView()
      .should('be.visible');
    catalogPage.isCardsDisplayed();
  },
  filterByKeyword: (filterName: string) => {
    cy.get(quickStartsPO.filterKeyword)
      .scrollIntoView()
      .click();
    cy.get(quickStartsPO.filterKeyword).type(filterName);
  },
  cardPresent: (cardName: string) => {
    cy.get(cardName)
      .scrollIntoView()
      .should('be.visible');
  },
  status: () => {
    cy.get(quickStartsPO.statusFilter)
      .scrollIntoView()
      .click();
    app.waitForLoad();
    cy.get(quickStartsPO.statusDropdown).should('be.visible');
  },
  executeQuickStart: (quickStart: string) => {
    cy.get(quickStart)
      .parent()
      .then(($el) => {
        if ($el.find(quickStartsPO.cardStatus).is(':visible')) {
          if ($el.text().includes('Complete')) {
            cy.log('quick start is complete');
          } else {
            cy.get(quickStart)
              .scrollIntoView()
              .click();
            app.waitForDocumentLoad();
            cy.get(quickStartSidebarPO.quickStartSidebarBody).should('be.visible');
            clickVisibleButton(quickStartSidebarPO.nextButton);
            cy.get(quickStartSidebarPO.quickStartSidebarBody)
              .find(quickStartSidebarPO.closeButton)
              .click();
            cy.get(quickStart)
              .parent()
              .find(quickStartsPO.cardStatus)
              .should('be.visible')
              .contains('Complete');
          }
        } else {
          cy.get(quickStart)
            .scrollIntoView()
            .click();
          app.waitForDocumentLoad();
          cy.get(quickStartSidebarPO.quickStartSidebarBody).should('be.visible');
          cy.get(quickStartSidebarPO.quickStartSidebarBody)
            .find(quickStartSidebarPO.startButton)
            .click();
          clickVisibleButton(quickStartSidebarPO.nextButton);
          cy.get(quickStartSidebarPO.quickStartSidebarBody)
            .find(quickStartSidebarPO.closeButton)
            .click();
          cy.get(quickStart)
            .parent()
            .find(quickStartsPO.cardStatus)
            .should('be.visible')
            .contains('Complete');
        }
      });
  },
  leaveQuickStartIncomplete: (quickStart: string) => {
    cy.get(quickStart)
      .scrollIntoView()
      .click();
    app.waitForDocumentLoad();
    cy.get(quickStartSidebarPO.quickStartSidebarBody).should('be.visible');
    cy.get(quickStartSidebarPO.quickStartSidebarBody)
      .find(quickStartSidebarPO.startButton)
      .click();
    closeQuickStart();
  },
};
