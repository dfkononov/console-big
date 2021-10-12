import { CatalogItem } from '../../../../../console-dynamic-plugin-sdk/src';

export const sampleClusterTaskCatalogItem: CatalogItem = {
  uid: '8a357c10-ea59-49a3-b4ea-26fd594afb10',
  type: 'Red Hat',
  name: 'ansible-tower-cli',
  description:
    'Ansible-tower-cli task simplifies starting jobs, workflow jobs, manage users, projects etc.\nAnsible Tower (formerly ‘AWX’) is a web-based solution that makes Ansible even more easy to use for IT teams of all kinds, It provides the tower-cli(Tower-CLI) command line tool that simplifies the tasks of starting jobs, workflow jobs, manage users, projects etc.',
  provider: 'Red Hat',
  tags: ['ansible', 'cli'],
  creationTimestamp: '2021-08-12T07:02:14Z',
  icon: {},
  attributes: {
    installed: '0.1',
    versions: [
      {
        id: '0.1',
        version: '0.1',
      },
    ],
    categories: ['CLI'],
  },
  cta: {
    label: 'Add',
  },
  data: {
    kind: 'Task',
    apiVersion: 'tekton.dev/v1beta1',
    metadata: {
      annotations: {
        'tekton.dev/categories': 'CLI',
        'tekton.dev/displayName': 'ansible tower cli',
        'tekton.dev/pipelines.minVersion': '0.12.1',
        'tekton.dev/tags': 'ansible, cli',
      },
      resourceVersion: '425457',
      name: 'ansible-tower-cli',
      uid: '8a357c10-ea59-49a3-b4ea-26fd594afb10',
      creationTimestamp: '2021-08-12T07:02:14Z',
      generation: 1,
      namespace: 'karthik',
      labels: {
        'app.kubernetes.io/version': '0.1',
      },
    },
    spec: {
      description:
        'Ansible-tower-cli task simplifies starting jobs, workflow jobs, manage users, projects etc.\nAnsible Tower (formerly ‘AWX’) is a web-based solution that makes Ansible even more easy to use for IT teams of all kinds, It provides the tower-cli(Tower-CLI) command line tool that simplifies the tasks of starting jobs, workflow jobs, manage users, projects etc.',
      params: [
        {
          default: 'false',
          description: 'Disable tower ssl verification',
          name: 'SSLVERIFY',
          type: 'string',
        },
        {
          default: ['--help'],
          description: 'The tower-cli commands to tun',
          name: 'ARGS',
          type: 'array',
        },
        {
          default: '',
          description: 'The Ansible Tower host',
          name: 'HOST',
          type: 'string',
        },
        {
          default: 'tower-creds',
          description: 'The Ansible Tower secret with credentials',
          name: 'tower-secret',
          type: 'string',
        },
      ],
      steps: [
        {
          args: [
            'echo -e "verify_ssl = $(params.SSLVERIFY)\\nverbose = true\\nhost = $(params.HOST)\\nusername = $USER\\npassword = $PASS" > ~/.tower_cli.cfg\nchmod 600 ~/.tower_cli.cfg\necho "Generated tower_cli.cfg file"\necho "-----------------------------"\nls -lah ~/ | grep tower_cli\necho "-----------------------------"',
          ],
          command: ['/bin/sh', '-c'],
          env: [
            {
              name: 'USER',
              valueFrom: {
                secretKeyRef: {
                  key: 'USER',
                  name: '$(params.tower-secret)',
                },
              },
            },
            {
              name: 'PASS',
              valueFrom: {
                secretKeyRef: {
                  key: 'PASS',
                  name: '$(params.tower-secret)',
                },
              },
            },
          ],
          image:
            'quay.io/rcmendes/ansible-tower-cli@sha256:3a61778f410526db8d6e02e87715d58ee770c4a4faf57ac408cb5ec1a025ef2c',
          name: 'config',
          resources: {},
        },
        {
          args: ['$(params.ARGS)'],
          command: ['/usr/bin/tower-cli'],
          image:
            'quay.io/rcmendes/ansible-tower-cli@sha256:3a61778f410526db8d6e02e87715d58ee770c4a4faf57ac408cb5ec1a025ef2c',
          name: 'tower-cli',
          resources: {},
        },
      ],
    },
  },
};

export const sampleTektonHubCatalogItem: CatalogItem = {
  uid: '1',
  type: 'Community',
  name: 'ansible-runner',
  description: 'Task to run Ansible playbooks using Ansible Runner',
  provider: 'Community',
  tags: ['cli'],
  icon: {
    class: 'build',
  },
  attributes: {
    installed: '',
    versions: [
      {
        id: 1,
        version: '0.1',
        rawURL:
          'https://raw.githubusercontent.com/tektoncd/catalog/main/task/ansible-runner/0.1/ansible-runner.yaml',
        webURL:
          'https://github.com/tektoncd/catalog/tree/main/task/ansible-runner/0.1/ansible-runner.yaml',
        platforms: [
          {
            id: 1,
            name: 'linux/amd64',
          },
        ],
      },
      {
        id: 2,
        version: '0.2',
        rawURL:
          'https://raw.githubusercontent.com/tektoncd/catalog/main/task/ansible-runner/0.2/ansible-runner.yaml',
        webURL:
          'https://github.com/tektoncd/catalog/tree/main/task/ansible-runner/0.2/ansible-runner.yaml',
        platforms: [
          {
            id: 1,
            name: 'linux/amd64',
          },
        ],
      },
    ],
    categories: ['CLI'],
  },
  cta: {
    label: 'Add',
  },
  data: {
    id: 1,
    name: 'ansible-runner',
    catalog: {
      id: 1,
      name: 'tekton',
      type: 'community',
    },
    categories: [
      {
        id: 11,
        name: 'CLI',
      },
    ],
    kind: 'Task',
    latestVersion: {
      id: 1,
      version: '0.1',
      displayName: 'Ansible Runner',
      description: 'Task to run Ansible playbooks using Ansible Runner',
      minPipelinesVersion: '0.12.1',
      rawURL:
        'https://raw.githubusercontent.com/tektoncd/catalog/main/task/ansible-runner/0.1/ansible-runner.yaml',
      webURL:
        'https://github.com/tektoncd/catalog/tree/main/task/ansible-runner/0.1/ansible-runner.yaml',
      updatedAt: '2021-07-26T12:15:08Z',
      platforms: [
        {
          id: 1,
          name: 'linux/amd64',
        },
      ],
    },
    tags: [
      {
        id: 78,
        name: 'cli',
      },
    ],
    platforms: [
      {
        id: 1,
        name: 'linux/amd64',
      },
    ],
    rating: 4.2,
  },
};

export const sampleCatalogItems: CatalogItem[] = [
  sampleClusterTaskCatalogItem,
  sampleTektonHubCatalogItem,
];
