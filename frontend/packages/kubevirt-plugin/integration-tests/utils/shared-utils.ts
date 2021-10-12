/* eslint-disable callback-return */
/* eslint-disable no-await-in-loop, no-console, no-underscore-dangle */
import { execSync } from 'child_process';
import { $, $$, by, browser, ExpectedConditions as until, element } from 'protractor';
import { By } from 'selenium-webdriver';
import { config } from '@console/internal-integration-tests/protractor.conf';

export function resolveTimeout(timeout: number, defaultTimeout: number) {
  return timeout !== undefined ? timeout : defaultTimeout;
}

export function removeLeakedResources(leakedResources: Set<string>) {
  const leakedArray: string[] = [...leakedResources];
  if (leakedArray.length > 0) {
    console.error(`Leaked ${leakedArray.join()}`);
    leakedArray
      .map((r) => JSON.parse(r) as { name: string; namespace: string; kind: string })
      .forEach(({ name, namespace, kind }) => {
        try {
          execSync(
            `kubectl delete --ignore-not-found=true -n ${namespace} --cascade ${kind} ${name}`,
          );
        } catch (error) {
          console.error(`Failed to delete ${kind} ${name}:\n${error}`);
        }
      });
  }
  leakedResources.clear();
}

export function addLeakableResource(leakedResources: Set<string>, resource) {
  leakedResources.add(
    JSON.stringify({
      name: resource.metadata.name,
      namespace: resource.metadata.namespace,
      kind: resource.kind,
    }),
  );
}

export function removeLeakableResource(leakedResources: Set<string>, resource) {
  leakedResources.delete(
    JSON.stringify({
      name: resource.metadata.name,
      namespace: resource.metadata.namespace,
      kind: resource.kind,
    }),
  );
}

export function createResource(resource) {
  execSync(`echo '${JSON.stringify(resource)}' | kubectl create -f -`);
}

export function createResources(resources) {
  resources.forEach(createResource);
}

export function applyResource(resource) {
  execSync(`echo '${JSON.stringify(resource)}' | kubectl apply -f -`);
}

export function deleteResource(resource, ignoreNotFound = true) {
  const kind = resource.kind === 'NetworkAttachmentDefinition' ? 'net-attach-def' : resource.kind;
  execSync(
    `kubectl delete --ignore-not-found=${ignoreNotFound} -n ${resource.metadata.namespace} --cascade ${kind} ${resource.metadata.name}`,
  );
}

export function deleteResources(resources, ignoreNotFound = true) {
  resources.forEach((resource) => {
    deleteResource(resource, ignoreNotFound);
  });
}

export async function withResource(
  resourceSet: Set<string>,
  resource: any,
  callback: Function,
  keepResource: boolean = false,
) {
  addLeakableResource(resourceSet, resource);
  await callback();
  if (!keepResource) {
    deleteResource(resource);
    removeLeakableResource(resourceSet, resource);
  }
}

export async function withResources(
  resourceSet: Set<string>,
  resources: any,
  callback: Function,
  keepResource: boolean = false,
) {
  resources.forEach((resource) => {
    addLeakableResource(resourceSet, resource);
  });
  await callback();
  if (!keepResource) {
    resources.forEach((resource) => {
      deleteResource(resource);
      removeLeakableResource(resourceSet, resource);
    });
  }
}

export async function click(elem: any, timeout?: number) {
  const _timeout = resolveTimeout(timeout, config.jasmineNodeOpts.defaultTimeoutInterval);
  await browser.wait(until.elementToBeClickable(elem), _timeout);
  await browser.executeScript('arguments[0].scrollIntoView()', elem);
  await elem.click();
}

export async function fillInput(elem: any, value: string) {
  // Sometimes there seems to be an issue with clear() method not clearing the input
  let attempts = 3;
  do {
    --attempts;
    if (attempts < 0) {
      throw Error(`Failed to fill input with value: '${value}'.`);
    }
    await browser.wait(until.and(until.presenceOf(elem), until.elementToBeClickable(elem)));
    // TODO: line below can be removed when pf4 tables in use.
    await elem.click();
    await elem.clear();
    await elem.sendKeys(value);
  } while ((await elem.getAttribute('value')) !== value);
}

async function selectDropdownOptionByLocator(dropdownId: string, optionLocator: By) {
  await click($(dropdownId));
  await browser.wait(until.presenceOf(element(optionLocator)));
  await $(`${dropdownId} + ul`)
    .element(optionLocator)
    .click();
}

export async function selectDropdownOption(dropdownId: string, optionText: string) {
  await selectDropdownOptionByLocator(dropdownId, by.linkText(optionText));
}

export async function selectDropdownOptionById(dropdownId: string, optionId: string) {
  await selectDropdownOptionByLocator(dropdownId, by.id(optionId));
}

export async function getDropdownOptions(dropdownId: string): Promise<string[]> {
  const options = [];
  await $(`${dropdownId} + ul`)
    .$$('li')
    .each((elem) => {
      elem
        .getText()
        .then((text) => {
          options.push(text);
        })
        .catch((err) => {
          return Promise.reject(err);
        });
    });
  return options;
}

export async function asyncForEach(iterable, callback) {
  const array = [...iterable];
  for (let index = 0; index < array.length; index++) {
    await callback(array[index], index, array);
  }
}

export const waitForCount = (elementArrayFinder: any, targetCount: number) => {
  return async () => {
    const count = await elementArrayFinder.count();
    return count === targetCount;
  };
};

export const waitForStringInElement = (elem: any, needle: string) => {
  return async () => {
    if (!(await elem.isPresent())) {
      return false;
    }
    const content = await elem.getText();
    return content.includes(needle);
  };
};

export const waitForStringNotInElement = (elem: any, needle: string) => {
  return async () => {
    if (!(await elem.isPresent())) {
      return false;
    }
    const content = await elem.getText();
    return !content.includes(needle);
  };
};

type CardInfo = {
  text: string;
  index: number;
};

const getOperatorHubCards = async (): Promise<CardInfo[]> => {
  const selector = $$('article .co-resource-item__resource-name');
  const cards: CardInfo[] = await selector.map(async (elem, index) => {
    return {
      text: await elem.getText(),
      index,
    };
  });
  return cards;
};

export const getOperatorHubCardIndex = async (name: string): Promise<CardInfo['index']> => {
  const cards = await getOperatorHubCards();
  const reqdCard = cards.find((elem) => elem.text === name);
  return reqdCard.index;
};
