import { AbstractControl, FormControl, FormGroup, Validators } from '@angular/forms';
// tslint:disable-next-line:max-line-length
import { Component, Injectable, Input, OnInit } from '@angular/core';

import { CentralServerService } from 'app/services/central-server.service';
import { ChargingStation } from 'app/types/ChargingStation';
import { GetCompositeScheduleCommandResult } from 'app/types/ChargingProfile';
import { MessageService } from 'app/services/message.service';
import { Router } from '@angular/router';
import { SpinnerService } from 'app/services/spinner.service';
import { TranslateService } from '@ngx-translate/core';
import { Utils } from 'app/utils/Utils';

@Component({
  selector: 'app-charging-station-advanced',
  templateUrl: './charging-station-advanced.component.html',
})
@Injectable()
export class ChargingStationAdvancedComponent implements OnInit {
  @Input() public chargingStation!: ChargingStation;

  public formGroup!: FormGroup;
  public connectorControl!: AbstractControl;
  public connectorIds: string[];
  public scheduleResult!: GetCompositeScheduleCommandResult|GetCompositeScheduleCommandResult[];
  public durationControl!: AbstractControl;

  constructor(
    private centralServerService: CentralServerService,
    private messageService: MessageService,
    private spinnerService: SpinnerService,
    private translateService: TranslateService,
    private router: Router) {
    this.connectorIds = [];
  }

  public ngOnInit() {
    // Set
    for (const connector of this.chargingStation.connectors) {
      this.connectorIds.push(connector.connectorId as unknown as string);
    }
    this.connectorIds.push(this.translateService.instant('chargers.smart_charging.connectors_all') as string);

    // Init the form
    this.formGroup = new FormGroup({
      connectorControl: new FormControl(this.translateService.instant('chargers.smart_charging.connectors_all'),
        Validators.compose([
          Validators.required,
        ])),
      durationControl: new FormControl(600,
        Validators.compose([
          Validators.required,
        ])),
    });

    this.connectorControl = this.formGroup.controls['connectorControl'];
    this.durationControl = this.formGroup.controls['durationControl'];
  }

  public getChargingProfilesForConnector() {
    if (!this.chargingStation) {
      return;
    }
    this.spinnerService.show();
    // Connector ID
    let connectorID: number = this.connectorControl.value as number;
    if (this.connectorControl.value === this.translateService.instant('chargers.smart_charging.connectors_all')) {
      connectorID = 0;
    }
    // Duration
    const durationSecs = this.durationControl.value as number * 60;
    this.centralServerService.getChargingStationCompositeSchedule(
      this.chargingStation.id, connectorID, durationSecs,
      this.chargingStation.powerLimitUnit).subscribe((chargingSchedule) => {
        this.scheduleResult = chargingSchedule;
        this.spinnerService.hide();
        this.formGroup.markAsPristine();
      }, (error) => {
        this.spinnerService.hide();
        // Unexpected error`
        Utils.handleHttpError(error, this.router, this.messageService,
          this.centralServerService, this.translateService.instant('general.unexpected_error_backend'));
        this.scheduleResult = error;
      });
  }
}
