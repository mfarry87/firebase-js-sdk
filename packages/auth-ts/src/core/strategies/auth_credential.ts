/**
 * @license
 * Copyright 2019 Google Inc.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */
import { UserCredential, OperationType } from '../../model/user_credential';
import { Auth } from '../..';
import {
  initializeCurrentUserFromIdTokenResponse,
  checkIfAlreadyLinked
} from '.';
import { IdTokenResponse } from '../../model/id_token';
import { User } from '../../model/user';
import {
  PhoneOrOauthTokenResponse,
  SignInWithPhoneNumberResponse
} from '../../api/authentication';
import { AuthCredential } from '../../model/auth_credential';
import { PhoneAuthProvider } from '../providers/phone';

export async function signInWithCredential(
  auth: Auth,
  credential: AuthCredential
): Promise<UserCredential> {
  const response: IdTokenResponse = await credential.getIdTokenResponse_(auth);
  const user = await initializeCurrentUserFromIdTokenResponse(auth, response);
  return new UserCredential(user, credential, OperationType.SIGN_IN);
}

export async function linkWithCredential(
  auth: Auth,
  user: User,
  credential: AuthCredential
): Promise<UserCredential> {
  await checkIfAlreadyLinked(auth, user, credential.providerId);
  const token = await user.getIdToken();
  const response = await credential.linkToIdToken_(auth, token);
  const newCred = authCredentialFromTokenResponse(response);
  user.stsTokenManager.updateFromServerResponse(response);
  await user.reload(auth);
  return new UserCredential(user, newCred, OperationType.LINK);
}

export function authCredentialFromTokenResponse(
  response: PhoneOrOauthTokenResponse
): AuthCredential | null {
  const {
    temporaryProof,
    phoneNumber
  } = response as SignInWithPhoneNumberResponse;
  if (temporaryProof && phoneNumber) {
    return PhoneAuthProvider.credentialFromProof(temporaryProof, phoneNumber);
  }
  return null;
}