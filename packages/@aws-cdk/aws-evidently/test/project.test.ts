import { Template } from '@aws-cdk/assertions';
import { Stack } from '@aws-cdk/core';
import { Project } from '../lib';

describe('Evidently Project', () => {
  test('creating a new project', () => {
    const stack = new Stack();

    new Project(stack, 'TestProject', {
      projectName: 'myTestProject',
    });

    const template = Template.fromStack(stack);
    template.resourceCountIs('AWS::Evidently::Project', 1);
    template.hasResourceProperties('AWS::Evidently::Project', {
      Name: 'myTestProject',
    });
  });

  test('a new project with all the attributes', () => {
    const stack = new Stack();

    new Project(stack, 'CompleteProject', {
      projectName: 'aCompleteProject',
      description: 'This project has it all',
    });

    const template = Template.fromStack(stack);
    template.resourceCountIs('AWS::Evidently::Project', 1);
    template.hasResourceProperties('AWS::Evidently::Project', {
      Name: 'aCompleteProject',
      Description: 'This project has it all',
    });
  });

  describe('Data delivery object', () => {
    test('with LogGroup', () => {
      const stack = new Stack();

      new Project(stack, 'WithLogGroupProject', {
        projectName: 'projectWithLogGroup',
        description: 'This project has a log group as event destination',
        dataDelivery: {
          logGroup: 'anEventLogGroup',
        },
      });

      const template = Template.fromStack(stack);
      template.resourceCountIs('AWS::Evidently::Project', 1);
      template.hasResourceProperties('AWS::Evidently::Project', {
        Name: 'projectWithLogGroup',
        DataDelivery: {
          LogGroup: 'anEventLogGroup',
        },
      });
    });

    test('with S3 destination', () => {
      const stack = new Stack();

      new Project(stack, 'WithS3DestinationProject', {
        projectName: 'projectWithS3Destination',
        dataDelivery: {
          s3: {
            bucketName: 'event-bucket',
            prefix: 'foo-',
          },
        },
      });

      const template = Template.fromStack(stack);
      template.resourceCountIs('AWS::Evidently::Project', 1);
      template.hasResourceProperties('AWS::Evidently::Project', {
        Name: 'projectWithS3Destination',
        DataDelivery: {
          S3: {
            BucketName: 'event-bucket',
            Prefix: 'foo-',
          },
        },
      });
    });
  });

  test('project from attributes', () => {
    const stack = new Stack();

    const project = Project.fromProjectAttributes(stack, 'MyProject', {
      projectArn: 'arn:aws:evidently:region:account-id:project/my-project',
    });

    expect(project.projectArn).toEqual('arn:aws:evidently:region:account-id:project/my-project');
  });

  test('project from ARN', () => {
    const stack = new Stack();

    const project = new Project(stack, 'WithProjectArn', {
      projectName: 'withProjectArnTestProject',
    });

    const fromArn = Project.fromProjectArn(stack, 'FromProjectArn', project.projectArn);
    expect(fromArn.projectArn).toEqual(project.projectArn);
  });
});