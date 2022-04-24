import { Template } from '@aws-cdk/assertions';
import { Stack } from '@aws-cdk/core';
import { Launch, Project } from '../lib';
import { LaunchGroup } from '../lib/launch';

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

    new Launch(stack, 'ValidLaunchGroups', {
      launchName: 'aNewLaunch',
      project: project,
      scheduledSplitsConfig: [],
      groups: [
        new LaunchGroup({
          feature: 'foo',
          groupName: 'fooGroup',
          variation: 'bar',
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

    expect(() => {
      new Launch(stack, 'ValidLaunchGroups', {
        launchName: 'aNewLaunch',
        project: project,
        scheduledSplitsConfig: [],
        groups: [...Array(6)].map(() =>
          new LaunchGroup({
            feature: 'foo',
            groupName: 'fooGroup',
            variation: 'bar',
            description: 'Foobar',
          }),
        ),
      });
    }).toThrow();
  });
});