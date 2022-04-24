import { Resource, IResource, Tag, Stack, ArnFormat } from '@aws-cdk/core';
import { Construct } from 'constructs';
import { CfnLaunch } from './evidently.generated';
import { IFeature, Variation } from './feature';
import { IProject } from './project';

/**
 * An Evidently Launch resource
 */
export interface ILaunch extends IResource {
  /**
   * The ARN of the launch resource
   *
   * @attribute
   */
  readonly launchArn: string;
  /**
   * A description of the launch resource
   *
   * @required false
   * @default -
   */
  readonly description?: string;
  /**
   * An array of structures that contains the feature and variations that are to be used for the launch.
   */
  readonly groups: LaunchGroup[];
  /**
   * An array of structures that define the metrics that will be used to monitor the launch performance.
   */
  readonly metricMonitors?: MetricDefinitionObject[];
  /**
   * The name of the launch resource
   *
   * @attribute
   */
  readonly launchName: string;
  /**
   * The name or ARN of the project that you want to create the launch in.
   */
  readonly project: IProject;
  /**
   * A randomization salt for generating an ID to determine which variation the user session is served.
   */
  readonly randomizationSalt?: string;
  /**
   * An array of structures that define the traffic allocation percentages among the feature variations during each step of the launch.
   */
  readonly scheduledSplitsConfig: StepConfig[];
  /**
   * Assigns one or more tags (key-value pairs) to the launch.
   */
  readonly tags?: Tag[];
}

/**
 * A reference to an Evidently Launch
 */
export interface LaunchAttributes {
  /**
   * The ARN of the launch
   */
  readonly launchArn: string;

  /**
   * The name of the launch
   */
  // readonly launchName: string;

  /**
   * The name or ARN of the project that you want to create the launch in.
   */
  readonly project: IProject;

  /**
   * An array of structures that contains the feature and variations that are to be used for the launch.
   */
  readonly groups: LaunchGroup[];

  /**
   * An array of structures that define the traffic allocation percentages among the feature variations during each step of the launch.
  */

  readonly scheduledSplitsConfig: StepConfig[];

  /**
   * An optional description for the launch
   *
   * @required false
   * @default - a description of the launch
   */
  readonly description?: string;
}

/**
 * Represents an Evidently Launch
 */
abstract class LaunchBase extends Resource implements ILaunch {
  public abstract readonly launchArn: string;
  public abstract readonly launchName: string;
  public abstract readonly groups: LaunchGroup[];
  public abstract readonly project: IProject;
  public abstract readonly scheduledSplitsConfig: StepConfig[];
}

/**
 * Properties for an Evidently Launch
 */
export interface LaunchProps {
  /**
   * The name of the launch.
   */
  readonly launchName: string;
  /**
   * The name or ARN of the project that you want to create the launch in.
   */
  readonly project: IProject;
  /**
   * An array of structures that contains the feature and variations that are to be used for the launch.
   */
  readonly groups: LaunchGroup[];
  /**
   * An array of structures that define the traffic allocation percentages among the feature variations during each step of the launch.
   */
  readonly scheduledSplitsConfig: StepConfig[];
  /**
   * A description of the launch
   *
   * @required false
   * @default - a description for the launch
   */
  readonly description?: string;
}

/**
 * An Evidently Launch
 */
export class Launch extends LaunchBase {
  /**
   * Import an existing Evidently Launch from provided ARN.
   *
   * @param scope The parent creating the construct
   * @param id The name of the construct
   * @param launchArn Evidently Launch ARN
   * @returns ILaunch
   */
  // public static fromLaunchArn(scope: Construct, id: string, launchArn: string): ILaunch {
  //   return Launch.fromLaunchAttributes(scope, id, {
  //     launchArn
  //   });
  // }

  /**
   * Creates an Evidently Launch construct that represents an external launch.
   *
   * @param scope The parent creating the construct
   * @param id The name of the construct
   * @param attrs Evidently Launch attributes
   * @returns ILaunch
   */
  public static fromLaunchAttributes(scope: Construct, id: string, attrs: LaunchAttributes): ILaunch {
    class ImportedLaunch extends LaunchBase {
      public readonly launchArn = attrs.launchArn;
      public readonly launchName = Stack.of(scope).splitArn(attrs.launchArn, ArnFormat.SLASH_RESOURCE_NAME).resourceName!;
      public readonly groups = attrs.groups;
      public readonly project = attrs.project;
      public readonly description? = attrs.description;
      public readonly scheduledSplitsConfig = attrs.scheduledSplitsConfig;
    }

    return new ImportedLaunch(scope, id);
  }

  public readonly launchArn: string;
  public readonly launchName: string;
  public readonly groups: LaunchGroup[];
  public readonly project: IProject;
  public readonly scheduledSplitsConfig: StepConfig[];
  /**
   * A description for the launch
   */
  public readonly description?: string;

  private readonly resource: CfnLaunch;

  constructor(scope: Construct, id: string, props: LaunchProps) {
    super(scope, id, {
      physicalName: props.launchName,
    });

    const { groups, scheduledSplitsConfig, project, description } = props;

    if (groups.length > 5) {
      throw new Error(`A launch can have up to five launch groups. You have specified ${groups.length} groups.`);
    }

    this.resource = new CfnLaunch(this, 'Resource', {
      name: props.launchName,
      project: props.project.projectArn,
      groups: this.renderGroups(groups),
      scheduledSplitsConfig,
    });

    this.project = project;
    this.groups = groups;
    this.scheduledSplitsConfig = scheduledSplitsConfig;
    this.description = description || '';

    this.launchArn = this.getResourceArnAttribute(this.resource.attrArn, {
      service: 'evidently',
      resource: 'launch',
      resourceName: this.physicalName,
    });

    this.launchName = this.getResourceNameAttribute(this.resource.ref);
  }

  private renderGroups(groups: LaunchGroup[]) {
    return groups.map((group) => {
      return {
        feature: group.feature.featureName,
        groupName: group.groupName,
        variation: group.variation.name,
        description: group.description,
      };
    });
  }
}

/**
 * A structure that defines one launch group in a launch. A launch group is a variation of the feature that you are including in the launch.
 */
export class LaunchGroup implements ILaunchGroup {
  public readonly feature: IFeature;
  public readonly groupName: string;
  public readonly variation: Variation;
  public readonly description?: string;

  constructor(props: LaunchGroupProps) {
    this.feature = props.feature;
    this.groupName = props.groupName;
    this.variation = props.variation;
    this.description = props.description;
  }
}

/**
 * Properties for a LaunchGroup
 */
export interface LaunchGroupProps {
  /**
   * The feature that this launch is using.
   */
  readonly feature: IFeature;
  /**
   * A name for this launch group. It can include up to 127 characters.
   */
  readonly groupName: string;
  /**
   * The feature variation to use for this launch group.
   */
  readonly variation: Variation;
  /**
   * A description of the launch group.
   *
   * @required false
   * @default -
   */
  readonly description?: string;
}

/**
 * A structure that defines one launch group in a launch. A launch group is a variation of the feature that you are including in the launch.
 */
export interface ILaunchGroup {
  /**
   * The feature that this launch is using.
   */
  readonly feature: IFeature;

  /**
   * A name for this launch group. It can include up to 127 characters.
   */
  readonly groupName: string;

  /**
   * The feature variation to use for this launch group.
   */
  readonly variation: Variation;

  /**
   * A description of the launch group.
   *
   * @required false
   * @default -
   */
  readonly description?: string;
}

/**
 * This structure defines a metric that you want to use to evaluate the variations during a launch or experiment.
 */
export interface MetricDefinitionObject {
  /**
   * The entity, such as a user or session, that does an action that causes a metric value to be recorded.
   */
  readonly entityIdKey: string;

  /**
   * The EventBridge event pattern that defines how the metric is recorded.
   */
  readonly eventPattern: string;

  /**
   * A name for the metric. It can include up to 255 characters.
   */
  readonly metricName: string;

  /**
   * A label for the units that the metric is measuring.
   *
   * @required false
   * @default -
   */
  readonly unitLabel?: string;

  /**
   * The value that is tracked to produce the metric.
   */
  readonly valueKey: string;
}

/**
 * A structure that defines when each step of the launch is to start, and how much launch traffic is to be allocated to each variation during each step.
 */
export interface IStepConfig {
  /**
   * An array of structures that define how much launch traffic to allocate to each launch group during this step of the launch.
   */
  readonly groupWeights: GroupToWeight[]

  /**
   * The date and time to start this step of the launch. Use UTC format, yyyy-MM-ddTHH:mm:ssZ.
   */
  readonly startTime: string;
}

/**
 * Properties for a StepConfig object
 */
export interface StepConfigProps {
  /**
   * An array of structures that define how much launch traffic to allocate to each launch group during this step of the launch.
   */
  readonly groupWeights: GroupToWeight[];
  /**
   * The date and time to start this step of the launch. Use UTC format, yyyy-MM-ddTHH:mm:ssZ.
   */
  readonly startTime: string;
}

/**
 * A structure that defines when each step of the launch is to start, and how much launch traffic is to be allocated to each variation during each step.
 */
export class StepConfig implements IStepConfig {
  /**
   * An array of structures that define how much launch traffic to allocate to each launch group during this step of the launch.
   */
  public readonly groupWeights: GroupToWeight[];
  /**
   * The date and time to start this step of the launch. Use UTC format, yyyy-MM-ddTHH:mm:ssZ.
   */
  public readonly startTime: string;

  constructor(props: StepConfigProps) {
    this.groupWeights = props.groupWeights;
    this.startTime = props.startTime;
  }
}

/**
 * A structure containing the percentage of launch traffic to allocate to one launch group.
 */
export interface GroupToWeight {
  /**
   * The name of the launch group. It can include up to 127 characters.
   */
  readonly groupName: string;

  /**
   * The portion of launch traffic to allocate to this launch group.
   */
  readonly splitWeight: number;
}