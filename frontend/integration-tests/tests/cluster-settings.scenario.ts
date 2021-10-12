import { browser } from 'protractor';

import { appHost, checkLogs, checkErrors } from '../protractor.conf';
import * as crudView from '../views/crud.view';
import * as clusterSettingsView from '../views/cluster-settings.view';
import * as horizontalnavView from '../views/horizontal-nav.view';

describe('Cluster Settings', () => {
  beforeEach(async () => {
    await browser.get(`${appHost}/settings/cluster`);
    await crudView.isLoaded();
  });

  afterEach(() => {
    checkLogs();
    checkErrors();
  });

  it('display page title, horizontal navigation tab headings and pages', async () => {
    expect(clusterSettingsView.heading.isPresent()).toBe(true);
    await horizontalnavView.clickHorizontalTab('Details');
    await crudView.isLoaded();
    await horizontalnavView.clickHorizontalTab('ClusterOperators');
    await crudView.isLoaded();
    await horizontalnavView.clickHorizontalTab('Configuration');
    await crudView.isLoaded();
  });
  it('display overview channel update modal and click cancel', async () => {
    await horizontalnavView.clickHorizontalTab('Details');
    await crudView.isLoaded();
    expect(clusterSettingsView.channelUpdateLink.isDisplayed()).toBe(true);
    await clusterSettingsView.channelUpdateLink.click();
    await crudView.isLoaded();

    expect(clusterSettingsView.channelPopupCancelButton.isDisplayed()).toBe(true);
    await clusterSettingsView.channelPopupCancelButton.click();
    await crudView.isLoaded();
  });
  it('display Cluster Operators page, click resource item link to display details. Check if the resource link title equals the details page header', async () => {
    await horizontalnavView.clickHorizontalTab('ClusterOperators');
    await crudView.isLoaded();

    expect(clusterSettingsView.clusterOperatorResourceLink.isDisplayed()).toBe(true);
    await clusterSettingsView.clusterOperatorResourceLink.click();
    await crudView.isLoaded();

    expect(clusterSettingsView.clusterResourceDetailsTitle.isDisplayed()).toBe(true);
    expect(clusterSettingsView.clusterResourceDetailsTitle.getText()).toBe('console');

    await horizontalnavView.clickHorizontalTab('YAML');
    await crudView.isLoaded();
  });
  it('display Configuration page, click Configuration Resource item link and display details. Check if the resource link title equals the details page header', async () => {
    await horizontalnavView.clickHorizontalTab('Configuration');
    await crudView.isLoaded();

    expect(clusterSettingsView.globalConfigResourceLink.isDisplayed()).toBe(true);
    await clusterSettingsView.globalConfigResourceLink.click();
    await crudView.isLoaded();

    expect(clusterSettingsView.clusterResourceDetailsTitle.isDisplayed()).toBe(true);
    expect(clusterSettingsView.clusterResourceDetailsTitle.getText()).toBe('cluster');

    await horizontalnavView.clickHorizontalTab('YAML');
    await crudView.isLoaded();
  });
  it('display Configuration page, click dropdown link to edit resource and display details, and check if details header is correct.', async () => {
    await horizontalnavView.clickHorizontalTab('Configuration');
    await crudView.isLoaded();

    await clusterSettingsView.globalConfigResourceRow.click();
    await crudView.isLoaded();

    expect(crudView.actionForLabel('Edit Console resource').isDisplayed()).toBe(true);
    await crudView.actionForLabel('Edit Console resource').click();
    await crudView.isLoaded();

    expect(clusterSettingsView.clusterResourceDetailsTitle.isDisplayed()).toBe(true);
    expect(clusterSettingsView.clusterResourceDetailsTitle.getText()).toBe('cluster');
  });
  it('display Configuration page, click Explore Console API in dropdown link and display details, and check if details header is correct.', async () => {
    await horizontalnavView.clickHorizontalTab('Configuration');
    await crudView.isLoaded();

    await clusterSettingsView.globalConfigResourceRow.click();
    await crudView.isLoaded();

    expect(crudView.actionForLabel('Explore Console API').isDisplayed()).toBe(true);
    await crudView.actionForLabel('Explore Console API').click();

    await clusterSettingsView.globalConfigDetailsTitleIsLoaded();
    expect(clusterSettingsView.globalConfigDetailsTitle.getText()).toBe('Console');
  });
});
