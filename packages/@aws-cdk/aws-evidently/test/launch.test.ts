import { Template } from '@aws-cdk/assertions';
import { Stack } from '@aws-cdk/core';
import { Launch, Project } from '../lib';
import { LaunchGroupObject } from '../lib/launch';

describe('An Evidently Launch resource', () => {
  test('creating a new Launch', () => {
    const stack = new Stack();
    const project = new Project(stack, 'TestProject', {
      projectName: 'myTestProject',
    });

    new Launch(stack, 'TestLaunch', {
      launchName: 'myTestLaunch',
      project: project.projectArn,
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
      project: project.projectArn,
      groups: [],
      scheduledSplitsConfig: [],
    });

    expect(launch.launchArn).toEqual('arn:aws:evidently:region:account-id:launch/my-launch');
  });
});

describe('LaunchGroupObjects', () => {
  test('a new launch with allowed number of LaunchGroupObjects', () => {
    const stack = new Stack();

    const project = new Project(stack, 'TestProject', {
      projectName: 'myTestProject',
    });

    new Launch(stack, 'ValidLaunchGroupObjects', {
      launchName: 'aNewLaunch',
      project: project.projectArn,
      scheduledSplitsConfig: [],
      groups: [
        new LaunchGroupObject({
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

  test('a new launch with more than five LaunchGroupObjects', () => {
    const stack = new Stack();

    const project = new Project(stack, 'TestProject', {
      projectName: 'myTestProject',
    });

    expect(() => {
      new Launch(stack, 'ValidLaunchGroupObjects', {
        launchName: 'aNewLaunch',
        project: project.projectArn,
        scheduledSplitsConfig: [],
        groups: [...Array(6)].map(() =>
          new LaunchGroupObject({
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