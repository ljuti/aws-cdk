import { Template } from '@aws-cdk/assertions';
import { Stack } from '@aws-cdk/core';
import { EntityOverride, Feature, VariationObject, VariationObjectValueType } from '../lib';


describe('AWS Evidently Feature', () => {
  test('creating a new feature', () => {
    const stack = new Stack();

    new Feature(stack, 'NewFeature', {
      featureName: 'myNewFeature',
      project: 'myProject',
      variations: [],
    });

    const template = Template.fromStack(stack);
    template.resourceCountIs('AWS::Evidently::Feature', 1);
    template.hasResourceProperties('AWS::Evidently::Feature', {
      Name: 'myNewFeature',
    });
  });

  test('feature from attributes', () => {
    const stack = new Stack();

    const feature = Feature.fromFeatureAttributes(stack, 'MyFeature', {
      featureArn: 'arn:aws:evidently:region:account-id:feature/my-feature',
      project: 'arn:aws:evidently:region:account-id:project/my-project',
      variations: [],
    });

    expect(feature.featureArn).toEqual('arn:aws:evidently:region:account-id:feature/my-feature');
  });
});

describe('Entity Overrides', () => {
  test('feature with an override', () => {
    const stack = new Stack();

    new Feature(stack, 'FeatureWithEntityOverride', {
      featureName: 'withOverrides',
      project: 'arn:aws:evidently:region:account-id:feature/with-overrides',
      variations: [
        new VariationObject({
          variationName: 'bar',
          valueType: VariationObjectValueType.STRING,
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
  test('string type variation', () => {
    const stack = new Stack();

    new Feature(stack, 'MyFeature', {
      featureName: 'StringTypeVariationFeature',
      project: 'arn:aws:evidently:region:account-id:project/my-project',
      variations: [
        new VariationObject({
          variationName: 'String variation',
          valueType: VariationObjectValueType.STRING,
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

    new Feature(stack, 'MyFeature', {
      featureName: 'BooleanTypeVariationFeature',
      project: 'arn:aws:evidently:region:account-id:project/my-project',
      variations: [
        new VariationObject({
          variationName: 'Boolean variation',
          valueType: VariationObjectValueType.BOOLEAN,
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

    new Feature(stack, 'MyFeature', {
      featureName: 'DoubleTypeVariationFeature',
      project: 'arn:aws:evidently:region:account-id:project/my-project',
      variations: [
        new VariationObject({
          variationName: 'Double variation',
          valueType: VariationObjectValueType.DOUBLE,
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

    new Feature(stack, 'MyFeature', {
      featureName: 'LongTypeVariationFeature',
      project: 'arn:aws:evidently:region:account-id:project/my-project',
      variations: [
        new VariationObject({
          variationName: 'Long variation',
          valueType: VariationObjectValueType.LONG,
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