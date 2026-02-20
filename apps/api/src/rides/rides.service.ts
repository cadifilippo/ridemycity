import {
  Injectable,
  ForbiddenException,
  NotFoundException,
} from '@nestjs/common';
import { getAdminDb } from '../auth/firebase-admin';

export interface StoredRide {
  id: string;
  coordinates: number[][];
}

@Injectable()
export class RidesService {
  private get db() {
    return getAdminDb();
  }

  async findByUser(uid: string): Promise<StoredRide[]> {
    const snapshot = await this.db
      .collection('rides')
      .where('uid', '==', uid)
      .get();

    return snapshot.docs.map((doc) => ({
      id: doc.id,
      coordinates: JSON.parse(doc.data().coordinates as string) as number[][],
    }));
  }

  async create(uid: string, coordinates: number[][]): Promise<StoredRide> {
    const ref = await this.db.collection('rides').add({
      uid,
      coordinates: JSON.stringify(coordinates),
      createdAt: new Date(),
    });

    return { id: ref.id, coordinates };
  }

  async delete(uid: string, id: string): Promise<void> {
    const ref = this.db.collection('rides').doc(id);
    const doc = await ref.get();

    if (!doc.exists) {
      throw new NotFoundException(`Ride ${id} not found`);
    }
    if (doc.data()!.uid !== uid) {
      throw new ForbiddenException('You do not own this ride');
    }

    await ref.delete();
  }
}
