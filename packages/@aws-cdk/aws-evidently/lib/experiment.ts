import { Resource, IResource, Tag, Stack, ArnFormat } from '@aws-cdk/core';
import { Construct } from 'constructs';
import { CfnExperiment } from './evidently.generated';
import { IProject } from './project';

/**
 * An Evidently Experiment resource
 */
export interface IExperiment extends IResource {
  /**
   * The ARN of the experiment resource
   *
   * @attribute
   */
  readonly experimentArn: string;

  /**
   * A description of the experiment resource
   *
   * @required false
   * @default -
   */
  readonly description?: string;

  /**
   * An array of structures that defines the metrics used for the experiment, and whether a higher or lower value for each metric is the goal.
   */
  readonly metricGoals: MetricGoal[];

  /**
   * The name of the experiment resource
   *
   * @attribute
   */
  readonly experimentName: string;

  /**
   * A structure that contains the configuration of which variation to use as the "control" version.
   */
  readonly onlineAbConfig: OnlineAbConfig;

  /**
   * The name or ARN of the project that this experiment belongs to
   */
  readonly project: IProject;

  /**
   * Randomization salt
   *
   * @required false
   * @default -
   */
  readonly randomizationSalt?: string;

  /**
   * The portion of the available audience that you want to allocate to this experiment, in thousandths of a percent.
   *
   * @required false
   * @default -
   */
  // readonly samplingRate?: ExperimentSamplingRate | number;
  readonly samplingRate?: number;

  /**
   * Tags
   *
   * @required false
   * @default -
   */
  readonly tags?: Tag[];

  /**
   * An array of structures that describe the configuration of each feature variation used in the experiment.
   */
  readonly treatments: Treatment[];
}

/**
 * A reference to an Evidently Experiment
 */
export interface ExperimentAttributes {
  /**
   * The ARN of the experiment
   */
  readonly experimentArn: string;

  /**
   * The name of the experiment
   */
  readonly experimentName: string;

  /**
   * Metrics for the experiment
   */
  readonly metricGoals: MetricGoal[];

  /**
   * Configuration object for the metric
   */
  readonly onlineAbConfig: OnlineAbConfig;

  /**
   * The name or ARN of the project
   */
  readonly project: IProject;

  /**
   * Traffic sampling rate for the experiment
   *
   * @required false
   * @default -
   */
  // readonly samplingRate?: ExperimentSamplingRate | number;
  readonly samplingRate?: number;

  /**
   * Treatments for the experiment
   */
  readonly treatments: Treatment[];
}

/**
 * Represents an Evidently Experiment
 */
abstract class ExperimentBase extends Resource implements IExperiment {
  public abstract readonly experimentArn: string;
  public abstract readonly experimentName: string;
  public abstract readonly metricGoals: MetricGoal[];
  public abstract readonly onlineAbConfig: OnlineAbConfig;
  public abstract readonly project: IProject;
  // public abstract readonly samplingRate?: ExperimentSamplingRate | number;
  public abstract readonly samplingRate?: number;
  public abstract readonly treatments: Treatment[];
}

/**
 * Properties for an Evidently Experiment
 */
export interface ExperimentProps {
  /**
   * The name of the experiment
   */
  readonly experimentName: string;
  /**
   * Metrics for the experiment
   */
  readonly metricGoals: MetricGoal[];
  /**
   * Configuration object
   */
  readonly onlineAbConfig: OnlineAbConfig;
  /**
   * The name or ARN of the project this experiment belongs to
   */
  readonly project: IProject;
  /**
   * Sampling rate of traffic that's diverted to the experiment
   *
   * @required false
   * @default -
   */
  // readonly samplingRate?: ExperimentSamplingRate | number;
  readonly samplingRate?: number;
  /**
   * Treatments
   */
  readonly treatments: Treatment[];
}

/**
 * An Evidently Experiment
 */
export class Experiment extends ExperimentBase {
  /**
   * Import an experiment from attributes
   *
   * @param scope The parent creating the construct
   * @param id The name of the construct
   * @param attrs Evidently Experiment attributes
   * @returns IExperiment
   */
  public static fromExperimentAttributes(scope: Construct, id: string, attrs: ExperimentAttributes): IExperiment {
    class ImportedExperiment extends ExperimentBase {
      public readonly experimentArn = attrs.experimentArn;
      public readonly experimentName = Stack.of(scope).splitArn(attrs.experimentArn, ArnFormat.SLASH_RESOURCE_NAME).resourceName!;
      public readonly metricGoals = attrs.metricGoals;
      public readonly onlineAbConfig = attrs.onlineAbConfig;
      public readonly project = attrs.project;
      public readonly samplingRate? = attrs.samplingRate;
      public readonly treatments = attrs.treatments;
    }

    return new ImportedExperiment(scope, id);
  }

  public readonly experimentArn: string;
  public readonly experimentName: string;
  public readonly metricGoals: MetricGoal[];
  public readonly onlineAbConfig: OnlineAbConfig;
  public readonly project: IProject;
  // public readonly samplingRate?: ExperimentSamplingRate | number;
  public readonly samplingRate?: number;
  public readonly treatments: Treatment[];

  private readonly resource: CfnExperiment;

  constructor(scope: Construct, id: string, props: ExperimentProps) {
    super(scope, id, {
      physicalName: props.experimentName,
    });

    const { metricGoals, onlineAbConfig, samplingRate, treatments } = props;

    if (metricGoals.length > 3) {
      throw new Error('You are specifying more than the supported number of MetricGoals for an experiment.');
    }

    this.resource = new CfnExperiment(this, 'Resource', {
      name: props.experimentName,
      project: props.project.projectArn,
      metricGoals: metricGoals.map(goal => goal._renderMetricGoal()),
      onlineAbConfig: onlineAbConfig._renderOnlineAbConfig(),
      treatments: treatments.map(treatment => treatment._renderTreatment()),
    });

    this.project = props.project;
    this.metricGoals = metricGoals;
    this.onlineAbConfig = onlineAbConfig;
    this.samplingRate = samplingRate;
    this.treatments = treatments;

    this.experimentArn = this.getResourceArnAttribute(this.resource.attrArn, {
      service: 'evidently',
      resource: 'experiment',
      resourceName: this.physicalName,
    });

    this.experimentName = this.getResourceNameAttribute(this.resource.ref);
  }
}

/**
 * A metric for an experiment
 */
export class MetricGoal {
  /**
   * Desired change for the variation
   */
  public readonly desiredChange: string;
  /**
   * The entity, such as a user or session, that does an action that causes a metric value to be recorded.
   */
  public readonly entityIdKey: string;
  /**
   * The EventBridge event pattern that defines how the metric is recorded.
   */
  public readonly eventPattern: string;
  /**
   * A name for the metric. It can include up to 255 characters.
   */
  public readonly metricName: string;
  /**
   * A label for the units that the metric is measuring.
   */
  public readonly unitLabel?: string;
  /**
   * The JSON path to reference the numerical metric value in the event.
   */
  public readonly valueKey: string;

  constructor(props: MetricGoalProps) {
    this.desiredChange = props.desiredChange;
    this.entityIdKey = props.entityIdKey;
    this.eventPattern = props.eventPattern;
    this.metricName = props.metricName;
    this.unitLabel = props.unitLabel;
    this.valueKey = props.valueKey;
  }

  /**
   *
   * @internal
   * @returns CfnExperiment.MetricGoalObjectProperty
   */
  public _renderMetricGoal(): CfnExperiment.MetricGoalObjectProperty {
    return {
      desiredChange: this.desiredChange,
      entityIdKey: this.entityIdKey,
      eventPattern: this.eventPattern,
      metricName: this.metricName,
      unitLabel: this.unitLabel,
      valueKey: this.valueKey,
    };
  }
}

/**
 * Properties for a metric
 */
export interface MetricGoalProps {
  /**
   * Desired change for the variation.
   */
  readonly desiredChange: string;
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
   * The JSON path to reference the numerical metric value in the event.
   */
  readonly valueKey: string;
}

/**
 * Configuration object for an experiment
 */
export class OnlineAbConfig {
  /**
   * The name of the variation that is to be the default variation that the other variations are compared to.
   */
  public readonly controlTreatmentName?: string;
  /**
   * A set of key-value pairs.
   */
  public readonly treatmentWeights?: TreatmentToWeight[];

  constructor(props: OnlineAbConfigProps) {
    this.controlTreatmentName = props.controlTreatmentName;
    this.treatmentWeights = props.treatmentWeights;
  }

  /**
   * @internal
   * @returns CfnExperiment.OnlineAbConfigObjectProperty
   */
  public _renderOnlineAbConfig(): CfnExperiment.OnlineAbConfigObjectProperty {
    return {
      controlTreatmentName: this.controlTreatmentName,
      treatmentWeights: this.treatmentWeights?.map(weight => weight._renderWeight()),
    };
  }
}

/**
 * Properties for a configuration object
 */
export interface OnlineAbConfigProps {
  /**
   * The name of the variation that is to be the default variation that the other variations are compared to.
   *
   * @required false
   * @default -
   */
  readonly controlTreatmentName?: string;

  /**
   * A set of key-value pairs.
   *
   * @required false
   * @default []
   */
  readonly treatmentWeights?: TreatmentToWeight[];
}

/**
 * Behavior treatment for an experiment
 */
export class Treatment {
  /**
   * Description of the treatment
   */
  public readonly description?: string;
  /**
   * Feature this treatment belongs to
   */
  public readonly feature: string;
  /**
   * The name of the treatment
   */
  public readonly treatmentName: string;
  /**
   * The variation this treatment is used for
   */
  public readonly variation: string;

  constructor(props: TreatmentProps) {
    this.description = props.description;
    this.feature = props.feature;
    this.treatmentName = props.treatmentName;
    this.variation = props.variation;
  }
  /**
   *
   * @internal
   * @returns CfnExperiment.TreatmentObjectProperty
   */
  public _renderTreatment(): CfnExperiment.TreatmentObjectProperty {
    return {
      description: this.description,
      feature: this.feature,
      treatmentName: this.treatmentName,
      variation: this.variation,
    };
  }
}

/**
 * Properties for a treatment
 */
export interface TreatmentProps {
  /**
   * Description of the treatment
   *
   * @required false
   * @default -
   */
  readonly description?: string;
  /**
   * Feature this treatment belongs to
   */
  readonly feature: string;
  /**
   * The name of the treatment
   */
  readonly treatmentName: string;
  /**
   * The variation this treatment is used for
   */
  readonly variation: string;
}

/**
 * Traffic distribution configuration for a treatment
 */
export class TreatmentToWeight {
  /**
   * The portion of experiment traffic to allocate to this treatment.
   */
  // public readonly splitWeight: TreatmentSplitWeight | number;
  public readonly splitWeight: number;
  /**
   * The name of the treatment.
   */
  public readonly treatment: string;

  constructor(props: TreatmentToWeightProps) {
    this.splitWeight = props.splitWeight;
    this.treatment = props.treatment;
  }

  /**
   * @internal
   * @returns CfnExperiment.TreatmentToWeightProperty
   */
  public _renderWeight(): CfnExperiment.TreatmentToWeightProperty {
    return {
      splitWeight: this.splitWeight,
      treatment: this.treatment,
    };
  }
}

/**
 * Properties for a traffic distribution
 */
export interface TreatmentToWeightProps {
  /**
   * The portion of experiment traffic to allocate to this treatment
   */
  // readonly splitWeight: TreatmentSplitWeight | number;
  readonly splitWeight: number;
  /**
   * The name of a treatment
   */
  readonly treatment: string;
}

// /**
//  * Pre-defined split weight values for convenience
//  */
// export enum TreatmentSplitWeight {
//   /**
//    * 5%
//    */
//   '5_PCT' = 5000,
//   /**
//    * 10%
//    */
//   '10_PCT' = 10000,
//   /**
//    * 20%
//    */
//   '20_PCT' = 20000,
//   /**
//    * 30%
//    */
//   '30_PCT' = 30000,
//   /**
//    * 40%
//    */
//   '40_PCT' = 40000,
//   /**
//    * 50%
//    */
//   '50_PCT' = 50000
// }

// /**
//  * Pre-defined sampling rate values for convenience
//  */
// export enum ExperimentSamplingRate {
//   /**
//    * 5%
//    */
//   '5_PCT' = 5000,
//   /**
//    * 10%
//    */
//   '10_PCT' = 10000,
//   /**
//    * 20%
//    */
//   '20_PCT' = 20000,
//   /**
//    * 30%
//    */
//   '30_PCT' = 30000,
//   /**
//    * 40%
//    */
//   '40_PCT' = 40000,
//   /**
//    * 50%
//    */
//   '50_PCT' = 50000
// }
