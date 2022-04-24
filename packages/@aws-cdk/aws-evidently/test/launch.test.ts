import { Template } from '@aws-cdk/assertions';
import { Stack } from '@aws-cdk/core';
import { Feature, Launch, Project, Variation, VariationValueType } from '../lib';
import { LaunchGroup, StepConfig } from '../lib/launch';

describe('An Evidently Launch resource', () => {
  test('creating a new Launch', () => {
    const stack = new Stack();
    const project = new Project(stack, 'TestProject', {
      projectName: 'myTestProject',
    });

    new Launch(stack, 'TestLaunch', {
      launchName: 'myTestLaunch',
      project: project,
      groups: [],
      scheduledSplitsConfig: [],
    });

    const template = Template.fromStack(stack);

    template.resourceCountIs('AWS::Evidently::Launch', 1);
    template.hasResourceProperties('AWS::Evidently::Launch', {
      Name: 'myTestLaunch',
    });
  });

  test('launch from attributes', () => {
    const stack = new Stack();

    const project = new Project(stack, 'TestProject', {
      projectName: 'myTestProject',
    });

    const launch = Launch.fromLaunchAttributes(stack, 'LaunchFromAttributes', {
      launchArn: 'arn:aws:evidently:region:account-id:launch/my-launch',
      project: project,
      groups: [],
      scheduledSplitsConfig: [],
    });

    expect(launch.launchArn).toEqual('arn:aws:evidently:region:account-id:launch/my-launch');
  });
});

describe('LaunchGroups', () => {
  test('a new launch with allowed number of LaunchGroups', () => {
    const stack = new Stack();

    const project = new Project(stack, 'TestProject', {
      projectName: 'myTestProject',
    });

    const variation = new Variation({
      variationName: 'bar',
      valueType: VariationValueType.STRING,
      value: 'baz',
    });

    const feature = new Feature(stack, 'FooFeature', {
      project: project,
      featureName: 'fooFeature',
      variations: [variation],
    });

    new Launch(stack, 'ValidLaunchGroups', {
      launchName: 'aNewLaunch',
      project: project,
      scheduledSplitsConfig: [],
      groups: [
        new LaunchGroup({
          feature: feature,
          groupName: 'fooGroup',
          variation: variation,
          description: 'Foobar',
        }),
      ],
    });

    const template = Template.fromStack(stack);
    template.resourceCountIs('AWS::Evidently::Launch', 1);
  });

  test('a new launch with more than five LaunchGroups', () => {
    const stack = new Stack();

    const project = new Project(stack, 'TestProject', {
      projectName: 'myTestProject',
    });

    const variation = new Variation({
      variationName: 'bar',
      valueType: VariationValueType.STRING,
      value: 'baz',
    });

    const feature = new Feature(stack, 'FooFeature', {
      project: project,
      featureName: 'fooFeature',
      variations: [variation],
    });

    expect(() => {
      new Launch(stack, 'ValidLaunchGroups', {
        launchName: 'aNewLaunch',
        project: project,
        scheduledSplitsConfig: [],
        groups: [...Array(6)].map(() =>
          new LaunchGroup({
            feature: feature,
            groupName: 'fooGroup',
            variation: variation,
            description: 'Foobar',
          }),
        ),
      });
    }).toThrow();
  });
});

describe('StepConfig', () => {
  test('creating a new StepConfig', () => {
    const config = new StepConfig({
      groupWeights: [

      ],
      startTime: '2025-11-25T23:59:59Z',
    });

    expect(config.groupWeights).toEqual([]);
    expect(config.startTime).toEqual('2025-11-25T23:59:59Z');
  });
});