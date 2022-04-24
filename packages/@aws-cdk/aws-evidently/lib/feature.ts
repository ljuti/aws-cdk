import { Resource, IResource, Tag, Stack, ArnFormat } from '@aws-cdk/core';
import { Construct } from 'constructs';
import { CfnFeature } from './evidently.generated';
import { IProject } from './project';

/**
 * An Evidently Feature resource
 */
export interface IFeature extends IResource {
  /**
   * The ARN of the feature resource
   *
   * @attribute
   */
  readonly featureArn: string;

  /**
   * The name of the variation to use as the default variation.
   *
   * @required false
   * @default -
   */
  readonly defaultVariation?: string;

  /**
   * An optional description of the feature
   *
   * @required false
   * @default -
   */
  readonly description?: string;

  /**
   * Specify users that should always be served a specific variation of a feature. Each user is specified by a key-value pair.
   *
   * @required false
   * @default -
   */
  readonly entityOverrides?: EntityOverride[];

  /**
   * An evaluation strategy for the feature
   *
   * @required false
   * @default -
   */
  readonly evaluationStrategy?: EvaluationStrategy;

  /**
   * The name of the feature, up to 127 characters.
   *
   * @attribute
   */
  readonly featureName: string;

  /**
   * An Evidently Project this feature belongs to
   */
  readonly project: IProject;

  /**
   * Tags
   */
  readonly tags?: Tag[];

  /**
   * An array of structures that contain the configuration of the feature's different variations.
   */
  readonly variations: Variation[];
}

/**
 * A reference to an Evidently Feature
 */
export interface FeatureAttributes {
  /**
   * The ARN of the feature
   */
  readonly featureArn: string;

  /**
   * An Evidently Project this feature belongs to
   */
  readonly project: IProject;

  /**
   * Variations
   */
  readonly variations: Variation[];
}

/**
 * Represents an Evidently Feature
 */
abstract class FeatureBase extends Resource implements IFeature {
  public abstract readonly featureArn: string;
  public abstract readonly featureName: string;
  public abstract readonly project: IProject;
  public abstract readonly variations: Variation[];
}

/**
 * Properties for an Evidently Feature
 */
export interface FeatureProps {
  /**
   * The name of the feature
   */
  readonly featureName: string;

  /**
   * An Evidently Project that this feature belongs to
   */
  readonly project: IProject;

  /**
   * Variations
   */
  readonly variations: Variation[];

  /**
   * Entity overrides
   *
   * @required false
   * @default -
   */
  readonly entityOverrides?: EntityOverride[];
}

/**
 * An Evidently Feature
 */
export class Feature extends FeatureBase {
  /**
   * Creates an Evidently Feature construct that represents an external feature.
   *
   * @param scope The parent creating the construct
   * @param id The name of the construct
   * @param attrs Evidently Feature attributes
   * @returns IFeature
   */
  public static fromFeatureAttributes(scope: Construct, id: string, attrs: FeatureAttributes): IFeature {
    class ImportedFeature extends FeatureBase {
      public readonly featureArn = attrs.featureArn;
      public readonly featureName = Stack.of(scope).splitArn(attrs.featureArn, ArnFormat.SLASH_RESOURCE_NAME).resourceName!;
      public readonly project = attrs.project;
      public readonly variations = attrs.variations;
    }

    return new ImportedFeature(scope, id);
  }

  public readonly featureArn: string;
  public readonly featureName: string;
  public readonly project: IProject;
  public readonly variations: Variation[];

  private readonly resource: CfnFeature;

  constructor(scope: Construct, id: string, props: FeatureProps) {
    super(scope, id, {
      physicalName: props.featureName,
    });

    const { project, variations } = props;

    this.resource = new CfnFeature(this, 'Resource', {
      name: props.featureName,
      project: props.project.projectArn,
      variations: props.variations.map(variation => variation._renderVariation()),
      entityOverrides: props.entityOverrides?.map(override => override._renderEntityOverride()),
    });

    this.project = project;
    this.variations = variations;

    this.featureArn = this.getResourceArnAttribute(this.resource.attrArn, {
      service: 'evidently',
      resource: 'feature',
      resourceName: this.physicalName,
    });

    this.featureName = this.getResourceNameAttribute(this.resource.ref);
  }
}

/**
 * A set of key-value pairs that specify users who should always be served a specific variation of a feature.
 */
export class EntityOverride {
  /**
   * The entity ID to be served the variation specified in Variation.
   */
  public readonly entityId: string;
  /**
   * The name of the variation to serve to the user session that matches the EntityId.
   */
  public readonly variation: string;

  constructor(props: EntityOverrideProps) {
    this.entityId = props.entityId;
    this.variation = props.variation;
  }

  /**
   * Renders EntityOverride in CloudFormation format
   *
   * @internal
   * @returns CfnFeature.EntityOverrideProperty
   */
  public _renderEntityOverride(): CfnFeature.EntityOverrideProperty {
    return {
      entityId: this.entityId,
      variation: this.variation,
    };
  }
}

/**
 * Properties for EntityOverride object
 */
export interface EntityOverrideProps {
  /**
   * The entity ID to be served the variation specified in Variation.
   */
  readonly entityId: string;
  /**
   * The name of the variation to serve to the user session that matches the EntityId.
   */
  readonly variation: string;
}

/**
 * Evaluation strategies
 */
export enum EvaluationStrategy {
  /**
   * All rules are evaluated
   */
  'ALL_RULES' = 'ALL_RULES',
  /**
   * Only default variation is evaluated
   */
  'DEFAULT_VARIATION' = 'DEFAULT_VARIATION'
}

/**
 * This structure contains the name and variation value of one variation of a feature.
 */
export class Variation {
  /**
   * A name for the variation. It can include up to 127 characters.
   */
  public readonly name: string | undefined;
  /**
   * The type of the variation value.
   */
  public readonly valueType: VariationValueType;
  /**
   * The value assigned to this variation.
   */
  public readonly value: boolean | number | string;

  constructor(props: VariationProps) {
    this.name = props.variationName;

    this.valueType = props.valueType;
    this.value = props.value;
  }

  /**
   * Creates and returns the CloudFormation representation of this variation.
   * @internal
   */
  public _renderVariation(): CfnFeature.VariationObjectProperty {
    return {
      variationName: this.name,
      booleanValue: this.isBoolean() ? <boolean> this.value : undefined,
      doubleValue: this.isDouble() ? <number> this.value : undefined,
      longValue: this.isLong() ? <number> this.value : undefined,
      stringValue: this.isString() ? <string> this.value : undefined,
    };
  }

  private isBoolean() {
    return (this.valueType === VariationValueType.BOOLEAN);
  }

  private isDouble() {
    return (this.valueType === VariationValueType.DOUBLE);
  }

  private isLong() {
    return (this.valueType === VariationValueType.LONG);
  }

  private isString() {
    return (this.valueType === VariationValueType.STRING);
  }
}

/**
 * The properties of a Variation
 */
export interface VariationProps {
  /**
   * Variation value type
   */
  readonly valueType: VariationValueType;
  /**
   * Value assigned to the variation
   */
  readonly value: boolean | number | string;
  /**
   * The name of the variation
   *
   * @required false
   * @default -
   */
  readonly variationName?: string;
}

/**
 * Variation value types for Variation
 */
export enum VariationValueType {
  /**
   * Boolean value type
   */
  'BOOLEAN',
  /**
   * Double value type
   */
  'DOUBLE',
  /**
   * Long value type
   */
  'LONG',
  /**
   * String value type
   */
  'STRING'
}