#!/usr/bin/env node
import * as cdk from '@aws-cdk/core';
import * as evidently from '../lib';

class LaunchStack extends cdk.Stack {
  constructor(scope: cdk.App, id: string) {
    super(scope, id);

    const project = new evidently.Project(this, 'MyProject', {
      projectName: 'myProject',
    });

    const editable = new evidently.Variation({
      variationName: 'editable',
      valueType: evidently.VariationValueType.BOOLEAN,
      value: true,
    });

    const readonly = new evidently.Variation({
      variationName: 'readonly',
      valueType: evidently.VariationValueType.BOOLEAN,
      value: false,
    });

    const feature = new evidently.Feature(this, 'LaunchableEditableGuestbookFeature', {
      project: project,
      featureName: 'Editing',
      variations: [
        editable,
        readonly,
      ],
      entityOverrides: [
        new evidently.EntityOverride({
          entityId: 'seb',
          variation: editable.name,
        }),
      ],
    });

    const editableGroup = new evidently.LaunchGroup({
      groupName: 'Editable',
      feature: feature,
      variation: editable,
    });

    const readonlyGroup = new evidently.LaunchGroup({
      groupName: 'Readonly',
      feature: feature,
      variation: readonly,
    });

    const launchConfiguration = new evidently.StepConfig({
      groupWeights: [
        {
          groupName: editableGroup.groupName,
          splitWeight: 50000,
        },
      ],
      startTime: '2025-11-25T23:59:59Z',
    });

    new evidently.Launch(this, 'LaunchableEditableGuestbookLaunch', {
      project: project,
      launchName: 'LaunchableEditableGuestbook',
      description: 'Launch the editable guest book feature',
      groups: [
        editableGroup,
        readonlyGroup,
      ],
      scheduledSplitsConfig: [launchConfiguration],
    });
  }
}

const app = new cdk.App();
new LaunchStack(app, 'aws-evidently-launch');
app.synth();