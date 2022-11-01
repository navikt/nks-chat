# CRM-NKS-CHAT

[![MIT License](https://img.shields.io/apm/l/atomic-design-ui.svg?)](https://github.com/navikt/crm-shared-template/blob/master/LICENSE)

Repository containing core components for the nks-chat functionality

## Dependencies

This package is dependant on the following packages

-   [crm-platform-base](https://github.com/navikt/crm-platform-base)
-   [crm-platform-integration](https://github.com/navikt/crm-platform-integration)
-   [crm-nks-base-components](https://github.com/navikt/crm-nks-base-components)
-   [crm-journal-utilities](https://github.com/navikt/crm-journal-utilities)
-   [crm-shared-user-notification](https://github.com/navikt/crm-shared-user-notification)
-   [crm-shared-flowComponents](https://github.com/navikt/crm-shared-flowComponents)
-   [crm-henvendelse](https://github.com/navikt/crm-henvendelse)

## Installation

1. Install [npm](https://nodejs.org/en/download/)
1. Install [Salesforce DX CLI](https://developer.salesforce.com/tools/sfdxcli)
    - Alternative: `npm install sfdx-cli --global`
1. Clone this repository ([GitHub Desktop](https://desktop.github.com) is recommended for non-developers)
1. Run `npm install` from the project root folder
1. Install [SSDX](https://github.com/navikt/ssdx)
    - **Non-developers may stop after this step**
1. Install [VS Code](https://code.visualstudio.com) (recommended)
    - Install [Salesforce Extension Pack](https://marketplace.visualstudio.com/items?itemName=salesforce.salesforcedx-vscode)
    - **Install recommended plugins!** A notification should appear when opening VS Code. It will prompt you to install recommended plugins.
1. Install [AdoptOpenJDK](https://adoptopenjdk.net) (only version 8 or 11)
1. Open VS Code settings and search for `salesforcedx-vscode-apex`
1. Under `Java Home`, add the following:
    - macOS: `/Library/Java/JavaVirtualMachines/adoptopenjdk-[VERSION_NUMBER].jdk/Contents/Home`
    - Windows: `C:\\Program Files\\AdoptOpenJDK\\jdk-[VERSION_NUMBER]-hotspot`

## Build

To build locally without using SSDX, do the following:

1. If you haven't authenticated a DX user to production / DevHub, run `sfdx auth:web:login -d -a production` and log in
    - Ask `#crm-platform-team` on Slack if you don't have a user
    - If you change from one repo to another, you can change the default DevHub username in `.sfdx/sfdx-config.json`, but you can also just run the command above
2. Create a scratch org, install dependencies and push metadata:

```bash
sfdx force:org:create -f ./config/project-scratch-def.json --setalias scratch_org --durationdays 1 --setdefaultusername
echo y | sfdx plugins:install sfpowerkit@2.0.1
keys="" && for p in $(sfdx force:package:list --json | jq '.result | .[].Name' -r); do keys+=$p":{key} "; done
sfdx sfpowerkit:package:dependencies:install -u scratch_org -r -a -w 60 -k ${keys}
sfdx force:source:push
sfdx force:org:open
```

## Post scratch setup

As some metadata have poor support for packaging and metadata deployment there are a few manual steps to perform to be able to test the chat solution:

1. Create a LiveChatButton
    - Go to setup > .. Chat Buttons & Invitations. Create a new chat button with omni-channel routing connected to the scratch chat queue
2. Create a embedded service deployment and configuration
    - Go to setup > .. Embedded Service Deployments and click new deployment, chose embedded chat and and deploy to default experience site
    - Under chat settings click start and and then save with the prefilled config.
3. Go to the experience site scratch_innboks and into builder. Find the embedded service chat component and update the chat deployment to the one newly created.
4. In the builder, open settings > Security and privacy and Enable relaxed csp (if not already enabled). Then under the CSP Errors section allow the two sites that have been blocked from the live agent endpoints.
5. Navigate to the workspace of scratch-innboks. The easiest way to get there is the hamburger in the top left of the builder. Go to Administration > Members and add customer profile Scratch Community Profile and save.
6. Go to setup > Permission sets > Scratch Permission set and add access to the service presence statuses needed for chat.
7. Run this command in the terminal

```
npm run scratchSetup
```

7. To start a chat find the Harry Potter Account and the use the Log In to Experience as User action.
8. To receive a chat go to an app with omni-console enabled, such as the scratch app, and change your omni-channel presence to Tilgjengelig for chat.

Other useful commands included in this package:

```
#Activate api mock for all profiles
npm run activateMock
#Deactive mock for all profiles
npm run activateMock
```

# Henvendelser

Enten:
Spørsmål knyttet til koden eller prosjektet kan stilles som issues her på GitHub

Eller:
Spørsmål knyttet til koden eller prosjektet kan stilles til teamalias@nav.no

## For NAV-ansatte

Interne henvendelser kan sendes via Slack i kanalen #crm-nks.
