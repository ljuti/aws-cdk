import { Template } from '@aws-cdk/assertions';
import { Stack } from '@aws-cdk/core';
import { EntityOverride, Feature, Variation, VariationValueType, Project } from '../lib';


describe('AWS Evidently Feature', () => {
  test('creating a new feature', () => {
    const stack = new Stack();
    const project = new Project(stack, 'MyProject', {
      projectName: 'myProject',
    });

    const variation = new Variation({
      variationName: 'defaultVariation',
      valueType: VariationValueType.STRING,
      value: 'foo',
    });

    new Feature(stack, 'NewFeature', {
      featureName: 'myNewFeature',
      project: project,
      variations: [variation],
    });

    const template = Template.fromStack(stack);
    template.resourceCountIs('AWS::Evidently::Feature', 1);
    template.hasResourceProperties('AWS::Evidently::Feature', {
      Name: 'myNewFeature',
    });
  });

  test('feature from attributes', () => {
    const stack = new Stack();
    const project = new Project(stack, 'MyProject', {
      projectName: 'myProject',
    });

    const feature = Feature.fromFeatureAttributes(stack, 'MyFeature', {
      featureArn: 'arn:aws:evidently:region:account-id:feature/my-feature',
      project: project,
      variations: [],
    });

    expect(feature.featureArn).toEqual('arn:aws:evidently:region:account-id:feature/my-feature');
  });
});

describe('Entity Overrides', () => {
  test('feature with an override', () => {
    const stack = new Stack();
    const project = new Project(stack, 'MyProject', {
      projectName: 'myProject',
    });

    new Feature(stack, 'FeatureWithEntityOverride', {
      featureName: 'withOverrides',
      project: project,
      variations: [
        new Variation({
          variationName: 'bar',
          valueType: VariationValueType.STRING,
          value: 'hello',
        }),
      ],
      entityOverrides: [
        new EntityOverride({
          entityId: 'foo',
          variation: 'bar',
        }),
      ],
    });

    const template = Template.fromStack(stack);
    template.hasResourceProperties('AWS::Evidently::Feature', {
      EntityOverrides: [
        {
          EntityId: 'foo',
          Variation: 'bar',
        },
      ],
    });
  });
});

describe('Variations', () => {
  test('variation with no name', () => {
    const variation = new Variation({
      valueType: VariationValueType.STRING,
      value: 'noName',
    });

    expect(variation.name).toEqual('');
  });

  test('no variations', () => {
    const stack = new Stack();
    const project = new Project(stack, 'MyProject', {
      projectName: 'myProject',
    });

    expect(() => {
      new Feature(stack, 'MyFeature', {
        featureName: 'StringTypeVariationFeature',
        project: project,
        variations: [],
      });
    }).toThrowError();
  });

  test('string type variation', () => {
    const stack = new Stack();
    const project = new Project(stack, 'MyProject', {
      projectName: 'myProject',
    });

    new Feature(stack, 'MyFeature', {
      featureName: 'StringTypeVariationFeature',
      project: project,
      variations: [
        new Variation({
          variationName: 'String variation',
          valueType: VariationValueType.STRING,
          value: 'foobar',
        }),
      ],
    });

    const template = Template.fromStack(stack);
    template.resourceCountIs('AWS::Evidently::Feature', 1);
    template.hasResourceProperties('AWS::Evidently::Feature', {
      Variations: [
        {
          VariationName: 'String variation',
          StringValue: 'foobar',
        },
      ],
    });
  });

  test('boolean type variation', () => {
    const stack = new Stack();
    const project = new Project(stack, 'MyProject', {
      projectName: 'myProject',
    });

    new Feature(stack, 'MyFeature', {
      featureName: 'BooleanTypeVariationFeature',
      project: project,
      variations: [
        new Variation({
          variationName: 'Boolean variation',
          valueType: VariationValueType.BOOLEAN,
          value: true,
        }),
      ],
    });

    const template = Template.fromStack(stack);
    template.resourceCountIs('AWS::Evidently::Feature', 1);
    template.hasResourceProperties('AWS::Evidently::Feature', {
      Variations: [
        {
          VariationName: 'Boolean variation',
          BooleanValue: true,
        },
      ],
    });
  });

  test('double type variation', () => {
    const stack = new Stack();
    const project = new Project(stack, 'MyProject', {
      projectName: 'myProject',
    });

    new Feature(stack, 'MyFeature', {
      featureName: 'DoubleTypeVariationFeature',
      project: project,
      variations: [
        new Variation({
          variationName: 'Double variation',
          valueType: VariationValueType.DOUBLE,
          value: 123456789,
        }),
      ],
    });

    const template = Template.fromStack(stack);
    template.resourceCountIs('AWS::Evidently::Feature', 1);
    template.hasResourceProperties('AWS::Evidently::Feature', {
      Variations: [
        {
          VariationName: 'Double variation',
          DoubleValue: 123456789,
        },
      ],
    });
  });

  test('long type variation', () => {
    const stack = new Stack();
    const project = new Project(stack, 'MyProject', {
      projectName: 'myProject',
    });

    new Feature(stack, 'MyFeature', {
      featureName: 'LongTypeVariationFeature',
      project: project,
      variations: [
        new Variation({
          variationName: 'Long variation',
          valueType: VariationValueType.LONG,
          value: 123456789,
        }),
      ],
    });

    const template = Template.fromStack(stack);
    template.resourceCountIs('AWS::Evidently::Feature', 1);
    template.hasResourceProperties('AWS::Evidently::Feature', {
      Variations: [
        {
          VariationName: 'Long variation',
          LongValue: 123456789,
        },
      ],
    });
  });
});